import {accessSync, constants, existsSync, mkdirSync} from 'fs';
import {join} from 'path';

import ffmpeg from 'fluent-ffmpeg';

import {templates} from '../templates';
import { Context } from '@temporalio/activity';
import { formatLog } from 'src/utils/log';

// Common ffmpeg event handlers
const setupFfmpegEvents = (
    command: ffmpeg.FfmpegCommand,
    resolve: (output: string) => void,
    reject: (error: Error) => void,
    outputPath: string,
) => {
    command
        .on('start', (commandLine: string) => {
            Context.current().log.info(formatLog('FFMPEG COMMAND STARTING:', commandLine));
        })
        .on('error', (err: Error) => {
            Context.current().log.error(formatLog('FFMPEG FAILED WITH ERROR:', err));
            reject(err);
        })
        .on('progress', (progress) => {
            Context.current().log.info(formatLog(
                `VIDEO PROCESSING: ${
                    progress.percent ? progress.percent.toFixed(2) : 'unknown'
                }% done | Frames: ${progress.frames || 0} | FPS: ${
                    progress.currentFps || 0
                } | Remaining: ${progress.timemark || 'unknown'}`,
            ));
        })
        .on('stderr', (stderrLine) => {
            Context.current().log.info(formatLog(2, 'FFMPEG STDERR OUTPUT:', stderrLine));
        })
        .on('end', () => {
            Context.current().log.info(formatLog('FFMPEG ENCODING COMPLETE! Output saved to:', outputPath));
            resolve(outputPath);
        });
};

// Verify that the directory is writable
const ensureDirectoryExists = (dirPath: string): boolean => {
    try {
        // First check if directory exists
        if (!existsSync(dirPath)) {
            Context.current().log.info(`DIRECTORY CHECK: Path "${dirPath}" does not exist, creating it now...`);
            mkdirSync(dirPath, {recursive: true});
            Context.current().log.info(`DIRECTORY CREATED: Successfully created "${dirPath}"`);
        }

        try {
            // Check if directory is writable
            accessSync(dirPath, constants.W_OK);
            Context.current().log.info(`DIRECTORY WRITE ACCESS: "${dirPath}" is writable`);
            return true;
        } catch (err) {
            Context.current().log.error(formatLog(`DIRECTORY PERMISSION ERROR: "${dirPath}" is not writable:`, err));
            return false;
        }
    } catch (err) {
        Context.current().log.error(formatLog(`DIRECTORY CREATION FAILED: Error creating directory "${dirPath}":`, err));
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
        Context.current().log.info(formatLog('VIDEO CREATION STARTED with parameters:', {
            folder,
            template,
            dimensions: `${width}x${height}`,
            accountType: paidUser ? 'PAID' : 'FREE',
            imageCount: imageFiles.length,
        }));

        if (imageFiles.length === 0) {
            Context.current().log.error('VIDEO CREATION ABORTED: No image files provided');
            reject(new Error('No image files provided'));
            return;
        }

        // Ensure the output directory exists and is writable
        if (!ensureDirectoryExists(folder)) {
            Context.current().log.error(`VIDEO CREATION ABORTED: Unable to write to output directory: "${folder}"`);
            reject(new Error(`Unable to write to directory: ${folder}`));
            return;
        }

        // Get template configuration
        const templateConfig = templates[template];
        if (!templateConfig) {
            Context.current().log.error(formatLog(
                `VIDEO CREATION ABORTED: Invalid template "${template}". Available templates: ${Object.keys(
                    templates,
                ).join(', ')}`,
            ));
            reject(new Error(`Invalid template: ${template}`));
            return;
        }

        const soundPath = join(process.cwd(), 'assets/audio', templateConfig.sound);
        const outputPath = join(folder, 'output.mp4');

        Context.current().log.info(`VIDEO OUTPUT PATH: "${outputPath}"`);
        Context.current().log.info(`AUDIO SOURCE PATH: "${soundPath}"`);

        try {
            // Create our ffmpeg command
            const command = ffmpeg();

            // Build the filter complex manually for better control
            let filterComplex = '';
            const validImages = [];

            // Add each image as input with its loop duration
            const templateImages = [...templateConfig.images];
            if (!paidUser) {
                Context.current().log.info('FREE USER DETECTED: Adding watermark slide');
                templateImages.push({loop: 3, path: ''});
            }

            // Process each image according to template configuration
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            templateImages.forEach((imgConfig: any, index: number) => {
                if (imageFiles[index] && imageFiles[index].trim() !== '') {
                    const duration = imgConfig.loop || 5; // Default to 5 seconds if not specified

                    Context.current().log.info(
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
                    Context.current().log.info(`SKIPPING IMAGE ${index + 1}: File not found or empty path`);
                }
            });

            // Add audio input
            Context.current().log.info(`ADDING AUDIO: "${soundPath}"`);
            command.input(soundPath);

            // Concat all prepared video streams
            if (validImages.length > 0) {
                Context.current().log.info(`BUILDING FILTERCOMPLEX: Concatenating ${validImages.length} image streams`);
                const inputs = Array.from({length: validImages.length}, (_, i) => `[v${i}]`).join(
                    '',
                );
                filterComplex += `${inputs}concat=n=${validImages.length}:v=1:a=0[vout];`;
                filterComplex += '[vout]format=yuv420p[outv]';

                Context.current().log.info(`FILTERCOMPLEX: ${filterComplex}`);
                command.complexFilter(filterComplex);

                // Configure output
                Context.current().log.info('CONFIGURING OUTPUT: Setting video and audio codecs and parameters');
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
                Context.current().log.error('VIDEO CREATION ABORTED: No valid images were found');
                reject(new Error('No valid images found for video creation'));
                return;
            }

            // Set output file
            command.output(outputPath).outputOption('-y');

            // Setup event handlers
            Context.current().log.info('STARTING FFMPEG ENCODING PROCESS');
            setupFfmpegEvents(command, resolve, reject, outputPath);
            Context.current().log.info('FFMPEG EVENTS SETUP COMPLETE');

            // Run the command
            command.run();
        } catch (error) {
            Context.current().log.error(formatLog('VIDEO CREATION FAILED: Unexpected error during processing:', error));
            reject(error);
        }
    });
};
