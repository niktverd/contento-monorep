/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-nested-ternary */
import {mkdirSync, readFileSync} from 'fs';
import {resolve} from 'path';

import {Request, Response} from 'express';
import {addDoc, collection} from 'firebase/firestore/lite';
import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import type {File} from 'formidable';
import {IncomingForm} from 'formidable';
import sharp from 'sharp';

import {templates} from './templates';
import {createVideo} from './utils/create-video';

import { workerLog } from 'src/utils/logger';
import { firestore, storage } from 'src/configs/firebase';

// Enable debug mode for maximum logging
const isDebug = true;

export function getSvg(text: string, textSize: string) {
    workerLog.info('Generating SVG with text:', text, 'size:', textSize);
    const svg = `
        <svg
            width="500"
            height="160"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
        >
            <style>
                .title {fill:rgba(177, 24, 25, 0.85); font-size: ${textSize}; font-family: Myriad Pro; font-weight: bold;
            </style>
            <text x="0%" y="50%" text-anchor="left" class="title">${text}</text>
        </svg>
    `;

    return svg;
}

export const config = {
    api: {
        bodyParser: false,
    },
};

const parseParamInt = (param: string | number | string[], base = '0') => {
    workerLog.info('parseParamInt input:', {param, base});
    const result = Math.round(parseFloat((param as string) ?? base));
    workerLog.info('parseParamInt result:', result);
    return result;
};

// const _parseParamFloat = (param: string | number | string[], base = '0') => {
//     return parseFloat((param as string) ?? base);
// };

const percentToPixels = (percent: number, pixel: number) => {
    workerLog.info('percentToPixels input:', {percent, pixel});
    const result = Math.round((percent * pixel) / 100);
    workerLog.info('percentToPixels result:', result);
    return result;
};

const isFile = (file: File | File[]): file is File => {
    workerLog.info('isFile check:', file);
    const result = (file as File).filepath !== undefined;
    workerLog.info('isFile result:', result);
    return result;
};

async function cropMain({
    imgPath,
    params,
    folderPath,
    fileName,
    index,
    time,
    ratio,
}: {
    imgPath: string;
    params: Record<string, string | number>;
    folderPath: string;
    fileName: string;
    index: string;
    time: string;
    ratio?: number;
}) {
    workerLog.info('cropMain START', {imgPath, params, folderPath, fileName, index, time, ratio});

    const rotation = parseParamInt(params.rotation);
    workerLog.info('Rotation value:', rotation);

    const cropInfo = {
        left: params.x ? parseParamInt(params.x) : 0,
        top: params.y ? parseParamInt(params.y) : 0,
        width: params.width ? parseParamInt(params.width) : 0,
        height: params.height ? parseParamInt(params.height) : 0,
    };
    workerLog.info('Initial cropInfo:', cropInfo);

    const width = parseParamInt(params.baseWidth, '100');
    const height = parseParamInt(params.baseHeight, '100');
    workerLog.info('Target dimensions:', {width, height});

    try {
        workerLog.info('Loading image from path:', imgPath);
        const treatingImage = sharp(imgPath);
        workerLog.info('Getting metadata...');
        const metadata = await treatingImage.metadata();
        workerLog.info('Image metadata:', metadata);

        const {width: widthPixel = 0, height: heightPixel = 0} = metadata;
        workerLog.info('Image dimensions:', {widthPixel, heightPixel});

        if ((!params.x || !params.y || !params.width || !params.height) && ratio) {
            workerLog.info('Calculating crop dimensions with ratio:', ratio);
            cropInfo.width = widthPixel;
            if (heightPixel < widthPixel / ratio) {
                workerLog.info('Height limited crop calculation');
                cropInfo.height = heightPixel;
                cropInfo.width = heightPixel * ratio;
            } else {
                workerLog.info('Width limited crop calculation');
                cropInfo.height = widthPixel / ratio;
            }

            cropInfo.left = (widthPixel - cropInfo.width) / 2;
            cropInfo.top = (heightPixel - cropInfo.height) / 2;
            workerLog.info('Centered crop position:', {left: cropInfo.left, top: cropInfo.top});

            cropInfo.left = (cropInfo.left / widthPixel) * 100;
            cropInfo.width = (cropInfo.width / widthPixel) * 100;
            cropInfo.height = (cropInfo.height / heightPixel) * 100;
            cropInfo.top = (cropInfo.top / heightPixel) * 100;
            workerLog.info('Crop dimensions in percentage:', cropInfo);
        }

        workerLog.info('Metadata and crop info:', {widthPixel, heightPixel, ...cropInfo});

        workerLog.info('Applying rotation:', rotation);
        treatingImage.rotate(rotation);

        workerLog.info('Converting to buffer and loading image...');
        const imageBuffer = await treatingImage.toBuffer();
        workerLog.info('Buffer size:', imageBuffer.length);
        await sharp(imageBuffer).metadata();

        workerLog.info('Converting percentage to pixels for crop');
        cropInfo.left = percentToPixels(cropInfo.left, widthPixel);
        cropInfo.width = percentToPixels(cropInfo.width, widthPixel);
        cropInfo.top = percentToPixels(cropInfo.top, heightPixel);
        cropInfo.height = percentToPixels(cropInfo.height, heightPixel);
        workerLog.info('Final crop dimensions in pixels:', cropInfo);

        workerLog.info('Cropping with dimensions:', cropInfo);
        workerLog.info('Target resize dimensions:', {width, height});
        const treatingImageCropped = treatingImage.extract(cropInfo);
        const finalFilePath = resolve(
            folderPath,
            new Date().toISOString() + '-' + fileName + '.png',
        );
        workerLog.info('Final image will be saved to:', finalFilePath);

        workerLog.info('Preparing SVG overlays');
        const textSvg = getSvg(fileName, '36px');
        const indexSvg = getSvg(index, '36px');
        const timeSvg = getSvg(time, '36px');

        workerLog.info('Compositing and saving image...');
        await treatingImageCropped
            .composite(
                [
                    {
                        input: Buffer.from(textSvg),
                        top: 10,
                        left: 10,
                    },
                    {
                        input: Buffer.from(indexSvg),
                        top: 50,
                        left: 10,
                    },
                    {
                        input: Buffer.from(timeSvg),
                        top: 90,
                        left: 10,
                    },
                ].filter((_a) => isDebug),
            )
            .resize(width, height)
            .png()
            .toFile(finalFilePath);

        workerLog.info('Image saved successfully to:', finalFilePath);
        return finalFilePath;
    } catch (error) {
        workerLog.error('Error in cropMain function:', error);
        throw error;
    }
}

export const crop = async (req: Request, res: Response) => {
    try {
        workerLog.info('crop endpoint START', {
            query: req.query,
            method: req.method,
            url: req.url,
            headers: req.headers,
        });

        const tokenId = req.query.tokenId as string;
        workerLog.info('Token ID:', tokenId);

        if (!tokenId) {
            workerLog.info('Missing tokenId, returning 404');
            res.status(404).json({
                ok: false,
                message: 'tokenId is not provided',
            });

            return;
        }

        const requestName = new Date().toISOString().replace(/[^0-9]/g, '');
        workerLog.info('Generated requestName:', requestName);

        const folderPath = resolve('./assets/output', requestName);
        workerLog.info('Creating output folder:', folderPath);
        mkdirSync(folderPath, {recursive: true});

        workerLog.info('Initializing form parser');
        const form = new IncomingForm({multiples: true});
        workerLog.info('Form parser options:', {multiples: true});

        // eslint-disable-next-line complexity
        form.parse(req, async function (err, fields, files) {
            workerLog.info('Form parsing complete', {
                error: err,
                fieldCount: Object.keys(fields).length,
                filesCount: Object.keys(files).length,
            });

            if (err) {
                workerLog.error('Error parsing form data:', err);
                res.status(500).json({error: 'Error parsing form data'});
                return;
            }

            workerLog.info('Fields:', fields);
            workerLog.info('Template:', req.query.template);

            const templateName = req.query.template as string;
            workerLog.info('Using template:', templateName);

            if (!templates[templateName]) {
                workerLog.error('Template not found:', templateName);
                res.status(400).json({error: 'Template not found'});
                return;
            }

            const images = templates[templateName].images;
            workerLog.info('Template images configuration:', images);

            const fileSaved: string[] = [];
            let index = 0;
            workerLog.info('Processing files from form data');

            for (const fileName in files) {
                if (Object.prototype.hasOwnProperty.call(files, fileName)) {
                    workerLog.info(`Processing file: ${fileName}, index: ${index}`);

                    if (images.length <= index) {
                        workerLog.info(
                            `Skipping file ${fileName} as index ${index} exceeds images length ${images.length}`,
                        );
                        continue;
                    }

                    const f = files[fileName]?.[0];
                    workerLog.info('File object:', f);

                    if (f && isFile(f)) {
                        workerLog.info(
                            `Processing file: ${f.originalFilename}, size: ${f.size}, type: ${f.mimetype}`,
                        );

                        const params: Record<string, string | number> = {
                            baseWidth: req.query.width as string,
                            baseHeight: req.query.height as string,
                        };
                        workerLog.info('Initial params:', params);

                        for (const param in req.query) {
                            if (
                                Object.prototype.hasOwnProperty.call(req.query, param) &&
                                f.originalFilename &&
                                param.includes(f.originalFilename)
                            ) {
                                const asString = req.query[param] as string;
                                const asNumber = Number(asString);
                                const paramKey = param.split(`${f.originalFilename}.`)[1];
                                params[paramKey] = isNaN(asNumber) ? asString : asNumber;
                                workerLog.info(`Added param ${paramKey}:`, params[paramKey]);
                            }
                        }

                        workerLog.info('Final params for cropMain:', params);
                        workerLog.info('Calling cropMain for file:', fileName);

                        const finalFilePath = await cropMain({
                            imgPath: f.filepath,
                            params,
                            folderPath,
                            fileName,
                            index: index.toString(),
                            time: images[index]?.loop?.toString() || '0',
                        });

                        workerLog.info('cropMain returned filepath:', finalFilePath);
                        fileSaved.push(finalFilePath);
                        index++;
                    }
                }
            }

            workerLog.info('All files processed. Total processed:', fileSaved.length);

            const ratio = Number(req.query.width) / Number(req.query.height);
            workerLog.info('Calculated ratio:', ratio);

            // eslint-disable-next-line no-negated-condition
            if (!req.query.paidUser) {
                workerLog.info('User is not a paid user, adding ending image');

                const endingFile =
                    ratio < 1
                        ? resolve('./assets/images/final-vertical.png')
                        : ratio > 1
                        ? resolve('./assets/images/final-horizontal.png')
                        : resolve('./assets/images/final-horizontal.png');

                workerLog.info('Selected ending file:', endingFile);

                workerLog.info('Processing ending image with cropMain');
                const finalFilePath = await cropMain({
                    imgPath: endingFile,
                    params: {
                        baseWidth: req.query.width as string,
                        baseHeight: req.query.height as string,
                    },
                    folderPath,
                    fileName: 'ending',
                    index: (0).toString(),
                    time: (1).toString(),
                    ratio,
                });

                workerLog.info('Ending image saved to:', finalFilePath);
                fileSaved.push(finalFilePath);
            } else {
                workerLog.info('User is a paid user, skipping ending image');
            }

            workerLog.info('Starting video creation');
            const width = parseParamInt((req.query.width as string) || '');
            const height = parseParamInt((req.query.height as string) || '');

            workerLog.info('Video dimensions:', {width, height});
            workerLog.info('Calling createVideo with params:', {
                imageCount: fileSaved.length,
                folder: folderPath,
                template: templateName,
                width,
                height,
                paidUser: Boolean(req.query.paidUser),
            });

            try {
                workerLog.info('Creating video');
                const outputFilePath = await createVideo({
                    imageFiles: fileSaved,
                    folder: folderPath,
                    template: templateName,
                    width,
                    height,
                    paidUser: Boolean(req.query.paidUser),
                });

                workerLog.info('Video created successfully at:', outputFilePath);

                workerLog.info('Reading file buffer for upload');
                const fileBuffer = readFileSync(outputFilePath);
                workerLog.info('File buffer size:', fileBuffer.length);

                const storagePath = `${tokenId}/${requestName}-output.mp4`;
                workerLog.info('Storage path for upload:', storagePath);

                const fileRef = ref(storage, storagePath);
                workerLog.info('Uploading to Firebase Storage');

                await uploadBytes(fileRef, fileBuffer);
                workerLog.info('Upload complete, getting download URL');

                const downloadURL = await getDownloadURL(fileRef);
                workerLog.info('Download URL:', downloadURL);

                workerLog.info('Uploading metadata to Firestore');
                const compiledFileRef = collection(firestore, 'videos', tokenId, 'items');

                const documentData = {
                    url: downloadURL,
                    name: requestName,
                    description: '',
                    template: templateName,
                    externalLink: '',
                    createdAt: new Date(),
                };
                workerLog.info('Document data:', documentData);

                const docRef = await addDoc(compiledFileRef, documentData);
                workerLog.info('Document added to Firestore with ID:', docRef.id);

                workerLog.info('Process completed successfully');

                workerLog.info('Sending response to client: check your profile in a few minutes');
                res.status(200).json({message: 'check your profile in a few minutes'});
            } catch (error) {
                workerLog.error('Error during video creation or upload:', error);
            }
        });
    } catch (error) {
        workerLog.error('Unhandled error in crop endpoint:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};
