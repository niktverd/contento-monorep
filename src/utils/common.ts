import dotenv from 'dotenv';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import { storage } from 'src/configs/firebase';
import { workerLog } from './logger';
import { IScenario } from '#types';
import { shuffle } from 'lodash';

dotenv.config();

export const getEnv = () => {
    return process.env.APP_ENV || 'development';
}

export const getRandomElementOfArray = <T>(array: T[]) => {
    return array[Math.floor(Math.random() * array.length)];
};

export const getWorkingDirectoryForVideo = (directoryName: string) => {
    const basePath = join(process.cwd(), 'videos-working-directory', directoryName + Math.random());
    if (!existsSync(basePath)) {
        mkdirSync(basePath, {recursive: true});
    }

    return basePath;
};

type UploadFileFromUrlArgs = {
    url: string;
    fileName: string;
};

export const uploadFileFromUrl = async ({url, fileName}: UploadFileFromUrlArgs) => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            responseType: 'arraybuffer',
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } as any);

        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || undefined;

        const fileRef = ref(storage, `${fileName}-${Math.random()}.mp4`);

        const metadata = {contentType};
        await uploadBytes(fileRef, fileBuffer, metadata);

        const downloadURL = await getDownloadURL(fileRef);

        return downloadURL;
    } catch (error) {
        workerLog.info('Ошибка при загрузке файла:', error);
        throw error;
    }
}

export const prepareCaption = (texts: IScenario['texts'] | undefined) => {
    const linkToAnotherAccount = shuffle(texts?.linkToAnotherAccount || [''])[0];
    const intro = shuffle(texts?.intro || [''])[0];
    const main = shuffle(texts?.main || [''])[0];
    const outro = shuffle(texts?.outro || [''])[0];

    return [linkToAnotherAccount, intro, main, outro].filter(Boolean).join('\n');
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export const uploadFileToServer = async (outputFilePath: string, uploadFileName: string) => {
    workerLog.info({outputFilePath, uploadFileName});
    const processedBuffer = readFileSync(outputFilePath);
    const fileRef = ref(storage, uploadFileName);
    const contentType = 'video/mp4';
    const metadata = {contentType};
    await uploadBytes(fileRef, processedBuffer, metadata);
    const downloadURL = await getDownloadURL(fileRef);
    workerLog.info('downloadURL', downloadURL);

    return downloadURL;
};
