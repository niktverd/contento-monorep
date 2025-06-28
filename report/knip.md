# Knip report

## Unused files (12)

* src/config/database.ts
* src/db/scripts/migrateToPostgres.ts
* src/db/services/UserService.ts
* src/sections/cloud-run/components/scenarios/CoverWithImage.ts
* src/sections/cloud-run/components/scenarios/LognVideoWithShortInjections.ts
* src/sections/cloud-run/components/scenarios/common.ts
* src/temporal/activities/configs.ts
* src/temporal/activities/instagram.activity.ts
* src/temporal/worker.ts
* src/tests/requests/imitateInstagramMessageWebhook.ts
* src/utils/migrationHelper.ts
* src/utils/scenarios.ts

## Unused dependencies (5)

| Name                   | Location          | Severity |
| :--------------------- | :---------------- | :------- |
| typescript-json-schema | package.json:96:6 | error    |
| @temporalio/testing    | package.json:72:6 | error    |
| cors                   | package.json:76:6 | error    |
| uuid                   | package.json:97:6 | error    |
| pg                     | package.json:92:6 | error    |

## Unused devDependencies (3)

| Name        | Location           | Severity |
| :---------- | :----------------- | :------- |
| @types/cors | package.json:102:6 | error    |
| @types/uuid | package.json:111:6 | error    |
| nanoid      | package.json:117:6 | error    |

## Unlisted dependencies (1)

| Name          | Location                        | Severity |
| :------------ | :------------------------------ | :------- |
| @jest/globals | src/temporal/__tests__/setup.ts | error    |

## Unlisted binaries (3)

| Name     | Location     | Severity |
| :------- | :----------- | :------- |
| temporal | package.json | error    |
| podman   | package.json | error    |
| open     | package.json | error    |

## Unresolved imports (1)

| Name                       | Location                                                   | Severity |
| :------------------------- | :--------------------------------------------------------- | :------- |
| #schemas/handlers/temporal | src/sections/temporal/components/workflow.component.ts:9:9 | error    |

## Unused exports (17)

| Name                                        | Location                                                              | Severity |
| :------------------------------------------ | :-------------------------------------------------------------------- | :------- |
| getSvg                                      | src/sections/cloud-run/components/reels-creator/create-video.ts:22:17 | error    |
| config                                      | src/sections/cloud-run/components/reels-creator/create-video.ts:41:14 | error    |
| logStreamsInfo                              | src/sections/cloud-run/components/video/ffprobe.helpers.ts:80:23      | error    |
| preprocessVideo                             | src/sections/chore/components/preprocess-video.ts:55:14               | error    |
| default                                     | src/types/models/InstagramMediaContainer.ts:49:8                      | error    |
| GetWorkflowStatusResponseSchema             | src/types/schemas/handlers/temporal.ts:26:14                          | error    |
| GetWorkflowResultResponseSchema             | src/types/schemas/handlers/temporal.ts:50:14                          | error    |
| GetWorkflowResultParamsSchema               | src/types/schemas/handlers/temporal.ts:46:14                          | error    |
| TemporalHealthResponseSchema                | src/types/schemas/handlers/temporal.ts:37:14                          | error    |
| StartVideoDownloadingWorkflowResponseSchema | src/types/schemas/handlers/temporal.ts:8:14                           | error    |
| default                                     | src/types/models/InstagramLocation.ts:24:8                            | error    |
| closeTemporalClient                         | src/sections/temporal/client.ts:130:23                                | error    |
| cancelWorkflow                              | src/sections/temporal/client.ts:119:23                                | error    |
| fetchDelete                                 | src/utils/fetchHelpers.ts:82:14                                       | error    |
| usaText                                     | src/config/places/usa.ts:55:14                                        | error    |
| default                                     | src/types/models/User.ts:25:8                                         | error    |
| default                                     | src/routes.ts:22:8                                                    | error    |

## Unused exported types (3)

| Name                   | Location                                                              | Severity |
| :--------------------- | :-------------------------------------------------------------------- | :------- |
| ColorCorrectionOptions | src/sections/cloud-run/components/video/primitives-optimized.ts:64:18 | error    |
| HueAdjustOptions       | src/sections/cloud-run/components/video/primitives-optimized.ts:79:18 | error    |
| BoxBlurOptions         | src/sections/cloud-run/components/video/primitives-optimized.ts:72:18 | error    |

## Unused exported enum members (8)

| Name                         | Location                    | Severity |
| :--------------------------- | :-------------------------- | :------- |
| INSTAGRAM_VIDEO_EVENTS_TIER2 | src/utils/constants.ts:11:5 | error    |
| INSTAGRAM_VIDEO_EVENTS_TIER3 | src/utils/constants.ts:12:5 | error    |
| INSTAGRAM_VIDEO_EVENTS_DEAD  | src/utils/constants.ts:13:5 | error    |
| INSTAGRAM_VIDEO_EVENTS       | src/utils/constants.ts:9:5  | error    |
| Timeout                      | src/types/enums.ts:29:5     | error    |
| RandomIndex                  | src/constants.ts:35:5       | error    |
| Min2                         | src/constants.ts:23:5       | error    |
| Min1                         | src/constants.ts:24:5       | error    |

## Duplicate exports (6)

| Name                                                           | Location                              | Severity |
| :------------------------------------------------------------- | :------------------------------------ | :------- |
| InstagramLocation|default                                      | src/types/models/InstagramLocation.ts | error    |
| PreparedVideo|default                                          | src/types/models/PreparedVideo.ts     | error    |
| Scenario|default                                               | src/types/models/Scenario.ts          | error    |
| Source|default                                                 | src/types/models/Source.ts            | error    |
| User|default                                                   | src/types/models/User.ts              | error    |
| RunProcessingActivityArgsSchema|ProcessVideoActivityArgsSchema | src/types/temporal.ts                 | error    |

