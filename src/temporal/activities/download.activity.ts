// Download Video Activity for Temporal Workflow
import {Context} from '@temporalio/activity';

import {getVideoDuration} from '#src/sections/cloud-run/components/video';
import {ISource} from '#src/types';
import {DownloadVideoActivityArgs, DownloadVideoActivityResponse} from '#src/types/temporal';
import {FetchRoutes, uploadFileFromUrl} from '#src/utils';
import {ThrownError} from '#src/utils/error';
import {fetchGet, fetchPatch} from '#src/utils/fetchHelpers';

// eslint-disable-next-line valid-jsdoc
/**
 * Download video activity - fetches source data and downloads video to Firebase Storage
 * Based on uploadFileFromUrl logic from src/utils/common.ts
 */
export async function downloadVideo(
    input: DownloadVideoActivityArgs,
): Promise<DownloadVideoActivityResponse> {
    const {sourceId} = input;

    Context.current().heartbeat('Fetching source data');

    const source = await fetchGet<ISource>({
        route: FetchRoutes.getOneSource,
        query: {id: sourceId},
    });

    if (!source) {
        throw new ThrownError(`Source with id ${sourceId} not found`, 404);
    }

    // Check if source already has firebaseUrl
    if (source.firebaseUrl) {
        return {
            success: true,
            source,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceUrl = (source.sources as any)?.instagramReel?.url;
    if (!sourceUrl) {
        throw new ThrownError('source.sources.instagramReel.url is empty', 400);
    }

    Context.current().heartbeat('Downloading video from source URL');
    const downloadURL = await uploadFileFromUrl({
        url: sourceUrl,
        fileName: `instagramReel-id-${source.id}`,
    });
    Context.current().heartbeat('Video has been uploaded to Firebase Storage.');
    const duration = await getVideoDuration(downloadURL);
    Context.current().heartbeat('Duration of video is gained.');

    const updatedSource = await fetchPatch({
        route: FetchRoutes.updateOneSource,
        body: {
            id: sourceId,
            firebaseUrl: downloadURL,
            duration,
        },
    });

    return {
        success: true,
        source: updatedSource,
    };
}
