import {existsSync, mkdirSync, rmSync} from 'fs';

import dotenv from 'dotenv';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    query,
    updateDoc,
    where,
} from 'firebase/firestore/lite';
import {shuffle} from 'lodash';

import {uploadYoutubeVideo} from '../../youtube/components/youtube';

import {firestore} from '#config/firebase';
import {Collection, DelayMS, SECOND_VIDEO, accessTokensArray} from '#src/constants';
import {MediaPostModel, Sources} from '#types';
import {getInstagramPropertyName, log, preparePostText} from '#utils';
import {createInstagramPostContainer, getMergedVideo} from '$/instagram/components';

dotenv.config();

const downloadSource = async (sources: Sources, firebaseId: string) => {
    log('downloading source...', {sources, x: sources.instagramReel});
    if (sources.instagramReel) {
        log('instagram found...');
        return await getMergedVideo({
            videoUrl: sources.instagramReel.url,
            finalVideoUrl: SECOND_VIDEO,
            firebaseId: firebaseId,
        });
    }

    if (sources.youtubeShort) {
        // download youtube video
        return null;
    }

    return null;
};

export const preprocessVideo = (ms: number) => {
    if (!process.env.ENABLE_PREPROCESS_VIDEO) {
        log('preprocessVideo', 'blocked');
        return;
    }
    log('preprocessVideo', 'started in', ms, 'ms');
    // на каждый видос 2 попытки
    // после второй неуспешной пишем в базу метку, что проблемный. Если такая метка уже была, удаляем из базы после двух попыток все уладить
    //   +    грузим по 10 видосов, выбираем рандомно с каким будем работать
    //   +    Если нечего обрабатывать, то откладываем запуск на 5 минут
    //   +    получить необработанное видео
    //   +/-  скачать необработанное видео
    //   +/-  скачать финалочку
    //   +/-  смерджить два видео
    //   +/-  загрузить в хранилище
    //   +    удаляем временные файлы
    //   +    обновить запись в базе: ссылку firebaseUrl в документе
    //   +    создать контейнеры в инстаграм
    // запланировать пост в youtube
    //   +    обновить запись в базе: статусы на площадках публикаций

    setTimeout(async () => {
        const collectionRef = collection(firestore, Collection.MediaPosts);
        const queryRef = query(collectionRef, where('firebaseUrl', '==', ''), limit(10));
        const docSnaps = await getDocs(queryRef);
        if (docSnaps.empty) {
            log('doc snap is empty');
            preprocessVideo(DelayMS.Min5);
            return;
        }

        const medias = shuffle(
            docSnaps.docs.map((snap) => ({...snap.data(), id: snap.id} as MediaPostModel)),
        );
        log('medias length:', medias.length);

        for (const media of medias) {
            const firebaseId = media.id;
            log('working with media id: ', firebaseId);
            try {
                for (let attempt = 0; attempt < 2; attempt++) {
                    // create video
                    if (!existsSync(firebaseId)) {
                        log('creating folder ...');
                        mkdirSync(firebaseId, {recursive: true});
                    }

                    const preparedVideo = await downloadSource(media.sources, firebaseId);
                    if (!preparedVideo) {
                        continue;
                    }

                    const {downloadURL: preparedVideoUrl, readstream} = preparedVideo;

                    // update firestore record
                    const documentRef = doc(collectionRef, firebaseId);
                    await updateDoc(documentRef, {
                        firebaseUrl: preparedVideoUrl,
                    });

                    const caption = preparePostText({
                        originalHashtags: media.sources.instagramReel?.originalHashtags || [],
                        account: 'carcar.tech #carcar.kz',
                        system: '',
                    });

                    await uploadYoutubeVideo({
                        videoReadStream: readstream,
                        title: 'Автозапчасти в Астане',
                        description: caption,
                    });

                    // create media container
                    for (const tokenObject of accessTokensArray) {
                        const result = await createInstagramPostContainer({
                            videoUrl: preparedVideoUrl,
                            caption:
                                caption ||
                                'Оптовые цены на запчасти и расходники для авто для наших подписчиков (пока только в Астане). Пишите в директ, какая запчасть или какое масло вы ищите и мы предоставим вам лучшие цены с оптовых складов. Присылайте ссылку на свой профиль, чтобы мы убедились, что вы наш подписчик.',
                            accessToken: tokenObject.token,
                            firebaseId: firebaseId,
                        });

                        if (result.success && result.mediaContainerId) {
                            // eslint-disable-next-line max-depth
                            const propertyName = getInstagramPropertyName(tokenObject.id);
                            await updateDoc(documentRef, {
                                [propertyName]: {
                                    ...media[propertyName],
                                    mediaContainerId: result.mediaContainerId,
                                    status: 'uploaded',
                                },
                            });
                        }
                    }

                    break;
                }
            } catch (error) {
                log({preprocessVideoCatch: error});
                const documentRef = doc(collectionRef, firebaseId);

                if (media.attempt) {
                    // delete media
                    await deleteDoc(documentRef);
                } else {
                    // save attempt to media
                    await updateDoc(documentRef, {
                        attempt: 2,
                    });
                }
            } finally {
                if (existsSync(firebaseId)) {
                    rmSync(firebaseId, {maxRetries: 2, force: true, recursive: true});
                }
            }
        }

        preprocessVideo(DelayMS.Sec1);
    }, ms);
};
