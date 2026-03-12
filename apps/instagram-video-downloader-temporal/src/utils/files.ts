import { writeFileSync } from "fs";
import { Context } from "@temporalio/activity";
import { formatLog } from "./log";

export const saveFileToDisk = async (url: string, filePath: string) => {
    
    Context.current().log.info(formatLog('saveFileToDisk', {url}));
    const response = await fetch(url, {
        method: 'GET',
        responseType: 'arraybuffer',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const fileBuffer = await response.arrayBuffer();
    writeFileSync(filePath, Buffer.from(fileBuffer));

    return filePath;
};
