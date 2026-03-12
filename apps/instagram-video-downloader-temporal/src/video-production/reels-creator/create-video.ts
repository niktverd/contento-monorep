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


import { firestore, storage } from '../../configs/firebase';
import { Context } from '@temporalio/activity';
import { formatLog } from 'src/utils/log';

// Enable debug mode for maximum logging
const isDebug = true;

export function getSvg(text: string, textSize: string) {
    
    
    Context.current().log.info(formatLog('Generating SVG with text:', text, 'size:', textSize));
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
    
    
    Context.current().log.info(formatLog('parseParamInt input:', {param, base}));
    const result = Math.round(parseFloat((param as string) ?? base));
    Context.current().log.info(formatLog('parseParamInt result:', result));
    return result;
};

// const _parseParamFloat = (param: string | number | string[], base = '0') => {
//     return parseFloat((param as string) ?? base);
// };

const percentToPixels = (percent: number, pixel: number) => {
    
    
    Context.current().log.info(formatLog('percentToPixels input:', {percent, pixel}));
    const result = Math.round((percent * pixel) / 100);
    Context.current().log.info(formatLog('percentToPixels result:', result));
    return result;
};

const isFile = (file: File | File[]): file is File => {
    
    
    Context.current().log.info(formatLog('isFile check:', file));
    const result = (file as File).filepath !== undefined;
    Context.current().log.info(formatLog('isFile result:', result));
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
    
    
    
    Context.current().log.info(formatLog('cropMain START', {imgPath, params, folderPath, fileName, index, time, ratio}));

    const rotation = parseParamInt(params.rotation);
    Context.current().log.info(formatLog('Rotation value:', rotation));

    const cropInfo = {
        left: params.x ? parseParamInt(params.x) : 0,
        top: params.y ? parseParamInt(params.y) : 0,
        width: params.width ? parseParamInt(params.width) : 0,
        height: params.height ? parseParamInt(params.height) : 0,
    };
    Context.current().log.info(formatLog('Initial cropInfo:', cropInfo));

    const width = parseParamInt(params.baseWidth, '100');
    const height = parseParamInt(params.baseHeight, '100');
    Context.current().log.info(formatLog('Target dimensions:', {width, height}));

    try {
        Context.current().log.info(formatLog('Loading image from path:', imgPath));
        const treatingImage = sharp(imgPath);
        Context.current().log.info(formatLog('Getting metadata...'));
        const metadata = await treatingImage.metadata();
        Context.current().log.info(formatLog('Image metadata:', metadata));

        const {width: widthPixel = 0, height: heightPixel = 0} = metadata;
        Context.current().log.info(formatLog('Image dimensions:', {widthPixel, heightPixel}));

        if ((!params.x || !params.y || !params.width || !params.height) && ratio) {
            Context.current().log.info(formatLog('Calculating crop dimensions with ratio:', ratio));
            cropInfo.width = widthPixel;
            if (heightPixel < widthPixel / ratio) {
                Context.current().log.info(formatLog('Height limited crop calculation'));
                cropInfo.height = heightPixel;
                cropInfo.width = heightPixel * ratio;
            } else {
                Context.current().log.info(formatLog('Width limited crop calculation'));
                cropInfo.height = widthPixel / ratio;
            }

            cropInfo.left = (widthPixel - cropInfo.width) / 2;
            cropInfo.top = (heightPixel - cropInfo.height) / 2;
            Context.current().log.info(formatLog('Centered crop position:', {left: cropInfo.left, top: cropInfo.top}));

            cropInfo.left = (cropInfo.left / widthPixel) * 100;
            cropInfo.width = (cropInfo.width / widthPixel) * 100;
            cropInfo.height = (cropInfo.height / heightPixel) * 100;
            cropInfo.top = (cropInfo.top / heightPixel) * 100;
            Context.current().log.info(formatLog('Crop dimensions in percentage:', cropInfo));
        }

        Context.current().log.info(formatLog('Metadata and crop info:', {widthPixel, heightPixel, ...cropInfo}));

        Context.current().log.info(formatLog('Applying rotation:', rotation));
        treatingImage.rotate(rotation);

        Context.current().log.info(formatLog('Converting to buffer and loading image...'));
        const imageBuffer = await treatingImage.toBuffer();
        Context.current().log.info(formatLog('Buffer size:', imageBuffer.length));
        await sharp(imageBuffer).metadata();

        Context.current().log.info(formatLog('Converting percentage to pixels for crop'));
        cropInfo.left = percentToPixels(cropInfo.left, widthPixel);
        cropInfo.width = percentToPixels(cropInfo.width, widthPixel);
        cropInfo.top = percentToPixels(cropInfo.top, heightPixel);
        cropInfo.height = percentToPixels(cropInfo.height, heightPixel);
        Context.current().log.info(formatLog('Final crop dimensions in pixels:', cropInfo));

        Context.current().log.info(formatLog('Cropping with dimensions:', cropInfo));
        Context.current().log.info(formatLog('Target resize dimensions:', {width, height}));
        const treatingImageCropped = treatingImage.extract(cropInfo);
        const finalFilePath = resolve(
            folderPath,
            new Date().toISOString() + '-' + fileName + '.png',
        );
        Context.current().log.info(formatLog('Final image will be saved to:', finalFilePath));

        Context.current().log.info(formatLog('Preparing SVG overlays'));
        const textSvg = getSvg(fileName, '36px');
        const indexSvg = getSvg(index, '36px');
        const timeSvg = getSvg(time, '36px');

        Context.current().log.info(formatLog('Compositing and saving image...'));
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

        Context.current().log.info(formatLog('Image saved successfully to:', finalFilePath));
        return finalFilePath;
    } catch (error) {
        Context.current().log.error(formatLog('Error in cropMain function:', error));
        throw error;
    }
}

export const crop = async (req: Request, res: Response) => {
    
    
    try {
        Context.current().log.info(formatLog('crop endpoint START', {
            query: req.query,
            method: req.method,
            url: req.url,
            headers: req.headers,
        }));

        const tokenId = req.query.tokenId as string;
        Context.current().log.info(formatLog('Token ID:', tokenId));

        if (!tokenId) {
            Context.current().log.info(formatLog('Missing tokenId, returning 404'));
            res.status(404).json({
                ok: false,
                message: 'tokenId is not provided',
            });

            return;
        }

        const requestName = new Date().toISOString().replace(/[^0-9]/g, '');
        Context.current().log.info(formatLog('Generated requestName:', requestName));

        const folderPath = resolve('./assets/output', requestName);
        Context.current().log.info(formatLog('Creating output folder:', folderPath));
        mkdirSync(folderPath, {recursive: true});

        Context.current().log.info(formatLog('Initializing form parser'));
        const form = new IncomingForm({multiples: true});
        Context.current().log.info(formatLog('Form parser options:', {multiples: true}));

        // eslint-disable-next-line complexity
        form.parse(req, async function (err, fields, files) {
            Context.current().log.info(formatLog('Form parsing complete', {
                error: err,
                fieldCount: Object.keys(fields).length,
                filesCount: Object.keys(files).length,
            }));

            if (err) {
                Context.current().log.error(formatLog('Error parsing form data:', err))
                res.status(500).json({error: 'Error parsing form data'});
                return;
            }

            Context.current().log.info(formatLog('Fields:', fields));
            Context.current().log.info(formatLog('Template:', req.query.template));

            const templateName = req.query.template as string;
            Context.current().log.info(formatLog('Using template:', templateName));

            if (!templates[templateName]) {
                Context.current().log.error(formatLog('Template not found:', templateName));
                res.status(400).json({error: 'Template not found'});
                return;
            }

            const images = templates[templateName].images;
            Context.current().log.info(formatLog('Template images configuration:', images));

            const fileSaved: string[] = [];
            let index = 0;
            Context.current().log.info(formatLog('Processing files from form data'));

            for (const fileName in files) {
                if (Object.prototype.hasOwnProperty.call(files, fileName)) {
                    Context.current().log.info(`Processing file: ${fileName}, index: ${index}`);

                    if (images.length <= index) {
                        Context.current().log.info(
                            `Skipping file ${fileName} as index ${index} exceeds images length ${images.length}`,
                        );
                        continue;
                    }

                    const f = files[fileName]?.[0];
                    Context.current().log.info(formatLog('File object:', f));

                    if (f && isFile(f)) {
                        Context.current().log.info(
                            `Processing file: ${f.originalFilename}, size: ${f.size}, type: ${f.mimetype}`,
                        );

                        const params: Record<string, string | number> = {
                            baseWidth: req.query.width as string,
                            baseHeight: req.query.height as string,
                        };
                        Context.current().log.info(formatLog('Initial params:', params));

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
                                Context.current().log.info(formatLog(`Added param ${paramKey}:`, params[paramKey]));
                            }
                        }

                        Context.current().log.info(formatLog('Final params for cropMain:', params));
                        Context.current().log.info(formatLog('Calling cropMain for file:', fileName));

                        const finalFilePath = await cropMain({
                            imgPath: f.filepath,
                            params,
                            folderPath,
                            fileName,
                            index: index.toString(),
                            time: images[index]?.loop?.toString() || '0',
                        });

                        Context.current().log.info(formatLog('cropMain returned filepath:', finalFilePath));
                        fileSaved.push(finalFilePath);
                        index++;
                    }
                }
            }

            Context.current().log.info(formatLog('All files processed. Total processed:', fileSaved.length));

            const ratio = Number(req.query.width) / Number(req.query.height);
            Context.current().log.info(formatLog('Calculated ratio:', ratio));

            // eslint-disable-next-line no-negated-condition
            if (!req.query.paidUser) {
                Context.current().log.info(formatLog('User is not a paid user, adding ending image'));

                const endingFile =
                    ratio < 1
                        ? resolve('./assets/images/final-vertical.png')
                        : ratio > 1
                        ? resolve('./assets/images/final-horizontal.png')
                        : resolve('./assets/images/final-horizontal.png');

                Context.current().log.info(formatLog('Selected ending file:', endingFile));

                Context.current().log.info(formatLog('Processing ending image with cropMain'));
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

                Context.current().log.info(formatLog('Ending image saved to:', finalFilePath));
                fileSaved.push(finalFilePath);
            } else {
                Context.current().log.info(formatLog('User is a paid user, skipping ending image'));
            }

            Context.current().log.info(formatLog('Starting video creation'));
            const width = parseParamInt((req.query.width as string) || '');
            const height = parseParamInt((req.query.height as string) || '');

            Context.current().log.info(formatLog('Video dimensions:', {width, height}));
            Context.current().log.info(formatLog('Calling createVideo with params:', {
                imageCount: fileSaved.length,
                folder: folderPath,
                template: templateName,
                width,
                height,
                paidUser: Boolean(req.query.paidUser),
            }));

            try {
                Context.current().log.info(formatLog('Creating video'));
                const outputFilePath = await createVideo({
                    imageFiles: fileSaved,
                    folder: folderPath,
                    template: templateName,
                    width,
                    height,
                    paidUser: Boolean(req.query.paidUser),
                });

                Context.current().log.info(formatLog('Video created successfully at:', outputFilePath));

                Context.current().log.info(formatLog('Reading file buffer for upload'));
                const fileBuffer = readFileSync(outputFilePath);
                Context.current().log.info(formatLog('File buffer size:', fileBuffer.length));

                const storagePath = `${tokenId}/${requestName}-output.mp4`;
                Context.current().log.info(formatLog('Storage path for upload:', storagePath));

                const fileRef = ref(storage, storagePath);
                Context.current().log.info(formatLog('Uploading to Firebase Storage'));

                await uploadBytes(fileRef, fileBuffer);
                Context.current().log.info(formatLog('Upload complete, getting download URL'));

                const downloadURL = await getDownloadURL(fileRef);
                Context.current().log.info(formatLog('Download URL:', downloadURL));

                Context.current().log.info(formatLog('Uploading metadata to Firestore'));
                const compiledFileRef = collection(firestore, 'videos', tokenId, 'items');

                const documentData = {
                    url: downloadURL,
                    name: requestName,
                    description: '',
                    template: templateName,
                    externalLink: '',
                    createdAt: new Date(),
                };
                Context.current().log.info(formatLog('Document data:', documentData));

                const docRef = await addDoc(compiledFileRef, documentData);
                Context.current().log.info(formatLog('Document added to Firestore with ID:', docRef.id));

                Context.current().log.info(formatLog('Process completed successfully'));

                Context.current().log.info(formatLog('Sending response to client: check your profile in a few minutes'));
                res.status(200).json({message: 'check your profile in a few minutes'});
            } catch (error) {
                Context.current().log.error(formatLog('Error during video creation or upload:', error));
            }
        });
    } catch (error) {
        Context.current().log.error(formatLog('Unhandled error in crop endpoint:', error));
        res.status(500).json({error: 'Internal server error'});
    }
};
