
import ffmpeg from 'fluent-ffmpeg';
import { Context } from '@temporalio/activity';
import { formatLog } from './log';

export const processAndConcatVideos = async (
    firstVideoPath: string,
    secondVideoPath: string,
    outputFilePath: string,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const tempFilePath = 'temp.mp4';
        

        ffmpeg()
            .input(firstVideoPath)
            .output(tempFilePath)
            .videoCodec('libx265')
            .videoFilters(
                'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1',
            )
            .on('start', (commandLine) => {
                Context.current().log.info(formatLog(1, 'FFmpeg command: ' + commandLine));
            })
            .on('stderr', (stderrLine) => {
                Context.current().log.error(formatLog(1, 'FFmpeg stderr:', stderrLine));
            })
            .on('error', (err) => {
                Context.current().log.error(formatLog(1, 'Ошибка при обработке видео:', err));
            })
            .on('end', () => {
                ffmpeg()
                    .input(tempFilePath)
                    .input(secondVideoPath)
                    .complexFilter([
                        // Подготовка видео: приведение каждого видео к одному формату (если нужно)
                        // '[0:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1[v0]',
                        '[1:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1[v1]',
                        // Конкатенация двух видео
                        '[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[outv][outa]',
                    ])
                    .outputOptions('-map [outv]') // Используем видеопоток из фильтра
                    .outputOptions('-map [outa]') // Используем аудиопоток из фильтра
                    .outputOptions('-movflags +faststart')
                    // .videoBitrate('500k') // Уменьшение битрейта видео
                    // .audioBitrate('128k') // Уменьшение битрейта аудио
                    // .videoCodec('libx265')
                    .output(outputFilePath) // Указываем выходной файл
                    .on('start', (commandLine) => {
                        Context.current().log.info(formatLog(2, 'FFmpeg command: ' + commandLine));
                    })
                    .on('stderr', (stderrLine) => {
                        Context.current().log.info(formatLog(2, 'FFmpeg stderr:', stderrLine));
                    })
                    .on('error', (err) => {
                        Context.current().log.error(formatLog(2, 'Ошибка при обработке видео:', err));
                        reject(err);
                    })
                    .on('end', () => {
                        Context.current().log.info(formatLog(2, 'Обработка и склейка видео завершены.'));
                        resolve();
                    })
                    .run();
            })
            .run();
    });
};
