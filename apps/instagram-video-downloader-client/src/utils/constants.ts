export enum Method {
    Post = 'POST',
    Get = 'GET',
    Patch = 'PATCH',
    Delete = 'DELETE',
}

export const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
};

export type AppHeaders = {
    'Content-Type': string;
    'x-organization-id'?: string;
    'x-user-token': string;
    Authorization: string;
};

export enum FetchRoutes2 {
    getMediaPosts = '/ui/get-media-posts',
    splitVideoInTheMiddle = '/ui/split-video-in-the-middle',
    testGreenScreen = '/ui/test-green-screen',
    // scenarios
    getScenarios = '/ui/get-scenarios',
    getScenario = '/ui/get-scenario-by-id',
    patchScenario = '/ui/patch-scenario',
    addScenario = '/ui/add-scenario',
    deleteScenario = '/ui/delete-scenario',
    // accounts
    // sources
    getAllSources = '/ui/get-all-sources',
    getOneSource = '/ui/get-one-source',
    getSourcesStatisticsByDays = '/ui/get-sources-statistics-by-days',

    getInsights = '/ui/get-insights',
    getInsightsReport = '/ui/get-insights-report',
    getMedia = '/ui/get-media',
    // getUserById = '/ui/get-user-by-id',
    getOwnerByMediaId = '/ui/get-owner-by--media-id',
    // test
    createVideoByScenario = '/ui/create-video-by-scenario',
    createInjectVideoByScenario = '/ui/run-injection-scenarios',
    downloadVideoFromSourceV3 = '/ui/download-video-from-source-v3',
    clearPreprodDatabase = '/ui/clear-proprod-database',
    // utils
    convertImageToVideo = '/ui/convert-image-to-video',
    getUserContent = '/ui/get-user-content',
    savePostForAnalysis = '/ui/save-post-for-futher-analysis',
    // pubsub
    pubsubPushTest = '/pubsub/push-test',
    // users
    createUser = '/ui/create-user',
    getUserById = '/ui/get-user-by-id',
    getUserByEmail = '/ui/get-user-by-email',
    getAllUsers = '/ui/get-all-users',
    deleteUser = '/ui/delete-user',

    // prepared videos
    createPreparedVideo = '/ui/add-prepared-video',
    getAllPreparedVideos = '/ui/get-all-prepared-videos',
    getPreparedVideoById = '/ui/get-prepared-video-by-id',
    getPreparedVideoDuplicates = '/ui/get-prepared-video-duplicates',
    getPreparedVideosStatisticsByDays = '/ui/get-prepared-videos-statistics-by-days',
    hasPreparedVideoBeenCreated = '/ui/has-prepared-video-been-created',
    // instagram media containers
    getAllInstagramMediaContainers = '/ui/get-all-instagram-media-containers',
    getInstagramMediaContainerById = '/ui/get-instagram-media-container-by-id',
    getInstagramMediaContainersStatisticsByDays = '/ui/get-instagram-media-containers-statistics-by-days',

    // instagram locations
    getAllInstagramLocations = '/ui/get-all-instagram-locations',
    getInstagramLocationById = '/ui/get-instagram-location-by-id',
    createInstagramLocation = '/ui/create-instagram-location',
    updateInstagramLocation = '/ui/update-instagram-location',
    deleteInstagramLocation = '/ui/delete-instagram-location',

    // manual message to run scenarios
    scheduleSourceVideoCreation = '/pubsub/shedule-source-video-creation',
    // cloud run scenario execution
    createCloudRunScenarioExecution = '/ui/create-cloud-run-scenario-execution',
    getAllCloudRunScenarioExecution = '/ui/get-cloud-run-scenario-execution',
    updateCloudRunScenarioExecutionStatus = '/ui/update-cloud-run-scenario-execution',

    runVideoProcessing = '/temporal/start-video-workflow',
    // start-video-downloading-workflow
    startVideoDownloadingWorkflow = '/temporal/start-video-downloading-workflow',
}
