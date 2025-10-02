import { writeFileSync } from "fs";
import { workerLog } from "./logger";

export const saveFileToDisk = async (url: string, filePath: string) => {
    workerLog.info('saveFileToDisk', {url});
    const response = await fetch(url, {
        method: 'GET',
        responseType: 'arraybuffer',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const fileBuffer = await response.arrayBuffer();
    writeFileSync(filePath, Buffer.from(fileBuffer));

    return filePath;
};
