import chalk from 'chalk';

import {getRequestContext} from './context';

const chalkMap = [
    chalk.bgBlue,
    chalk.bgCyan,
    chalk.bgGray,
    chalk.bgGreen,
    chalk.bgMagenta,
    chalk.bgRed,
    chalk.bgWhite,
    chalk.bgYellow,
    chalk.bgBlueBright,
    chalk.bgCyanBright,
    chalk.bgGreenBright,
    chalk.bgMagentaBright,
    chalk.bgRedBright,
    chalk.bgWhiteBright,
    chalk.bgYellowBright,
];

const getGroupLabels = () => {
    const error = new Error();
    const stack = error.stack?.split('\n');
    const functions = stack?.slice(3) || [];
    const stackPrepared: string[] = [];
    for (let i = 0; i < functions.length; i++) {
        if (!functions[i]) {
            continue;
        }

        const match = functions[i].match(/at (\w+)/);

        const localDepth = i < chalkMap.length ? i : chalkMap.length - 1;
        stackPrepared.push(chalkMap[localDepth](match ? match[1] : 'anonymous'));
    }

    return stackPrepared;
};

export const log = (...messages: unknown[]) => {
    if (process.env.TEST_FILE || process.env.APP_ENV === 'test') {
        return;
    }

    const context = getRequestContext();
    const reqId = context?.requestId || 'no-context';
    const isDevelopment = process.env.APP_ENV === 'development';
    const groupLabels = getGroupLabels();
    if (isDevelopment) {
        console.group(...groupLabels);
        console.log(`[${reqId}]`, ...messages);
        console.groupEnd();
    } else {
        console.log(JSON.stringify([`reqId_${reqId}`, ...messages, ...groupLabels]));
    }
};

export const logError = (...messages: unknown[]) => {
    if (process.env.TEST_FILE || process.env.APP_ENV === 'test') {
        return;
    }

    const context = getRequestContext();
    const reqId = context?.requestId || 'no-context';
    const userId = context?.userId;
    const organizationId = context?.organizationId;
    const isDevelopment = process.env.APP_ENV === 'development';
    const groupLabels = getGroupLabels();

    // Enhanced error logging with context information
    const contextInfo = [];
    if (userId) contextInfo.push(`userId:${userId}`);
    if (organizationId) contextInfo.push(`orgId:${organizationId}`);
    const contextString = contextInfo.length > 0 ? ` [${contextInfo.join(', ')}]` : '';

    if (isDevelopment) {
        console.group(chalk.bgRed('ERROR'));
        console.group(...groupLabels);
        console.error(`[${reqId}]${contextString}`, ...messages);
        console.groupEnd();
        console.groupEnd();
    } else {
        console.error(
            JSON.stringify([
                `reqId_${reqId}`,
                `context_${JSON.stringify(context)}`,
                ...messages,
                ...groupLabels,
                groupLabels.join(' > '),
            ]),
        );
    }
};
