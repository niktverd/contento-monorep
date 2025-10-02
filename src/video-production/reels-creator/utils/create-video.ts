import {accessSync, constants, existsSync, mkdirSync} from 'fs';
import {join} from 'path';

import ffmpeg from 'fluent-ffmpeg';

import {templates} from '../templates';
import { workerLog } from 'src/utils/logger';

// Common ffmpeg event handlers
const setupFfmpegEvents = (
    command: ffmpeg.FfmpegCommand,
    resolve: (output: string) => void,
    reject: (error: Error) => void,
    outputPath: string,
) => {
    command
        .on('start', (commandLine: string) => {
            workerLog.info('FFMPEG COMMAND STARTING:', commandLine);
        })
        .on('error', (err: Error) => {
            workerLog.error('FFMPEG FAILED WITH ERROR:', err);
            reject(err);
        })
        .on('progress', (progress) => {
            workerLog.info(
                `VIDEO PROCESSING: ${
                    progress.percent ? progress.percent.toFixed(2) : 'unknown'
                }% done | Frames: ${progress.frames || 0} | FPS: ${
                    progress.currentFps || 0
                } | Remaining: ${progress.timemark || 'unknown'}`,
            );
        })
        .on('stderr', (stderrLine) => {
            workerLog.info(2, 'FFMPEG STDERR OUTPUT:', stderrLine);
        })
        .on('end', () => {
            workerLog.info('FFMPEG ENCODING COMPLETE! Output saved to:', outputPath);
            resolve(outputPath);
        });
};

// Verify that the directory is writable
const ensureDirectoryExists = (dirPath: string): boolean => {
    try {
        // First check if directory exists
        if (!existsSync(dirPath)) {
            workerLog.info(`DIRECTORY CHECK: Path "${dirPath}" does not exist, creating it now...`);
            mkdirSync(dirPath, {recursive: true});
            workerLog.info(`DIRECTORY CREATED: Successfully created "${dirPath}"`);
        }

        try {
            // Check if directory is writable
            accessSync(dirPath, constants.W_OK);
            workerLog.info(`DIRECTORY WRITE ACCESS: "${dirPath}" is writable`);
            return true;
        } catch (err) {
            workerLog.error(`DIRECTORY PERMISSION ERROR: "${dirPath}" is not writable:`, err);
            return false;
        }
    } catch (err) {
        workerLog.error(`DIRECTORY CREATION FAILED: Error creating directory "${dirPath}":`, err);
        return false;
    }
};

export const createVideo = ({
    imageFiles,
    folder,
    template = 'first',
    width,
    height,
    paidUser,
}: {
    imageFiles: string[];
    folder: string;
    template: string;
    width: number;
    height: number;
    paidUser: boolean;
}): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Debug input params
        workerLog.info('VIDEO CREATION STARTED with parameters:', {
            folder,
            template,
            dimensions: `${width}x${height}`,
            accountType: paidUser ? 'PAID' : 'FREE',
            imageCount: imageFiles.length,
        });

        if (imageFiles.length === 0) {
            workerLog.error('VIDEO CREATION ABORTED: No image files provided');
            reject(new Error('No image files provided'));
            return;
        }

        // Ensure the output directory exists and is writable
        if (!ensureDirectoryExists(folder)) {
            workerLog.error(`VIDEO CREATION ABORTED: Unable to write to output directory: "${folder}"`);
            reject(new Error(`Unable to write to directory: ${folder}`));
            return;
        }

        // Get template configuration
        const templateConfig = templates[template];
        if (!templateConfig) {
            workerLog.error(
                `VIDEO CREATION ABORTED: Invalid template "${template}". Available templates: ${Object.keys(
                    templates,
                ).join(', ')}`,
            );
            reject(new Error(`Invalid template: ${template}`));
            return;
        }

        const soundPath = join(process.cwd(), 'assets/audio', templateConfig.sound);
        const outputPath = join(folder, 'output.mp4');

        workerLog.info(`VIDEO OUTPUT PATH: "${outputPath}"`);
        workerLog.info(`AUDIO SOURCE PATH: "${soundPath}"`);

        try {
            // Create our ffmpeg command
            const command = ffmpeg();

            // Build the filter complex manually for better control
            let filterComplex = '';
            const validImages = [];

            // Add each image as input with its loop duration
            const templateImages = [...templateConfig.images];
            if (!paidUser) {
                workerLog.info('FREE USER DETECTED: Adding watermark slide');
                templateImages.push({loop: 3, path: ''});
            }

            // Process each image according to template configuration
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            templateImages.forEach((imgConfig: any, index: number) => {
                if (imageFiles[index] && imageFiles[index].trim() !== '') {
                    const duration = imgConfig.loop || 5; // Default to 5 seconds if not specified

                    workerLog.info(
                        `PROCESSING IMAGE ${index + 1}: "${
                            imageFiles[index]
                        }" with duration ${duration}s`,
                    );

                    // Add input with loop and duration
                    command
                        .input(imageFiles[index])
                        .inputOptions(['-loop', '1'])
                        .inputOption('-t', String(duration));

                    validImages.push(index);

                    // Add setsar filter for each input to ensure consistent SAR
                    filterComplex += `[${
                        validImages.length - 1
                    }:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,setsar=1:1[v${
                        validImages.length - 1
                    }];`;
                } else {
                    workerLog.info(`SKIPPING IMAGE ${index + 1}: File not found or empty path`);
                }
            });

            // Add audio input
            workerLog.info(`ADDING AUDIO: "${soundPath}"`);
            command.input(soundPath);

            // Concat all prepared video streams
            if (validImages.length > 0) {
                workerLog.info(`BUILDING FILTERCOMPLEX: Concatenating ${validImages.length} image streams`);
                const inputs = Array.from({length: validImages.length}, (_, i) => `[v${i}]`).join(
                    '',
                );
                filterComplex += `${inputs}concat=n=${validImages.length}:v=1:a=0[vout];`;
                filterComplex += '[vout]format=yuv420p[outv]';

                workerLog.info(`FILTERCOMPLEX: ${filterComplex}`);
                command.complexFilter(filterComplex);

                // Configure output
                workerLog.info('CONFIGURING OUTPUT: Setting video and audio codecs and parameters');
                command.outputOptions([
                    '-map',
                    '[outv]',
                    '-map',
                    `${validImages.length}:a`,
                    '-c:v',
                    'libx264',
                    '-c:a',
                    'aac',
                    '-r',
                    '60',
                    '-b:v',
                    '1024k',
                    '-shortest',
                ]);
            } else {
                workerLog.error('VIDEO CREATION ABORTED: No valid images were found');
                reject(new Error('No valid images found for video creation'));
                return;
            }

            // Set output file
            command.output(outputPath).outputOption('-y');

            // Setup event handlers
            workerLog.info('STARTING FFMPEG ENCODING PROCESS');
            setupFfmpegEvents(command, resolve, reject, outputPath);
            workerLog.info('FFMPEG EVENTS SETUP COMPLETE');

            // Run the command
            command.run();
        } catch (error) {
            workerLog.error('VIDEO CREATION FAILED: Unexpected error during processing:', error);
            reject(error);
        }
    });
};
