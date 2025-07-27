import {readFileSync} from 'fs';

import chalk from 'chalk';

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
    if (process.env.TEST_FILE) {
        return;
    }

    let reqId = '';
    try {
        reqId = readFileSync('reqId.log', 'utf8');
    } catch {}
    const isDevelopment = process.env.APP_ENV === 'development';
    const groupLabels = getGroupLabels();
    if (isDevelopment) {
        console.group(...groupLabels);
        console.log(reqId, ...messages);
        console.groupEnd();
    } else {
        console.log(JSON.stringify([`reqId_${reqId}`, ...messages, ...groupLabels]));
    }
};

export const logError = (...messages: unknown[]) => {
    let reqId = '';
    try {
        reqId = readFileSync('reqId.log', 'utf8');
    } catch {}
    const isDevelopment = process.env.APP_ENV === 'development';
    const groupLabels = getGroupLabels();
    if (isDevelopment) {
        console.group(chalk.bgRed('ERROR'));
        console.group(...groupLabels);
        console.error(reqId, ...messages);
        console.groupEnd();
        console.groupEnd();
    } else {
        console.error(JSON.stringify([`reqId_${reqId}`, ...messages, ...groupLabels]));
    }
};

// eslint-disable-next-line valid-jsdoc
/**
 * Log database connection information
 */
export const logDatabaseConnection = (dbUrl: string, dbName?: string) => {
    const isDevelopment = process.env.APP_ENV === 'development';

    // Extract database name and host from URL for logging (without credentials)
    let parsedInfo = 'Unknown database';
    try {
        const url = new URL(dbUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const database = url.pathname.slice(1); // Remove leading slash
        parsedInfo = `${database}@${host}:${port}`;
    } catch {
        if (dbName) {
            parsedInfo = dbName;
        }
    }

    if (isDevelopment) {
        console.log(chalk.green(`[INFO] Connecting to application database: ${parsedInfo}`));
    } else {
        console.log(JSON.stringify(['[INFO] Connecting to application database:', parsedInfo]));
    }
};

// eslint-disable-next-line valid-jsdoc
/**
 * Log successful database connection
 */
export const logDatabaseConnected = (dbUrl: string, dbName?: string) => {
    const isDevelopment = process.env.APP_ENV === 'development';

    // Extract database and host info from URL for logging (format: database@host:port)
    let parsedInfo = 'Unknown database';
    try {
        const url = new URL(dbUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const database = url.pathname.slice(1); // Remove leading slash
        parsedInfo = `${database}@${host}:${port}`;
    } catch {
        if (dbName) {
            parsedInfo = dbName;
        }
    }

    if (isDevelopment) {
        console.log(chalk.green(`[INFO] Connected to ${parsedInfo}`));
    } else {
        console.log(JSON.stringify(['[INFO] Connected to', parsedInfo]));
    }
};

// eslint-disable-next-line valid-jsdoc
/**
 * Log database schema version after successful connection
 */
export const logDatabaseSchemaVersion = (version: string) => {
    const isDevelopment = process.env.APP_ENV === 'development';

    if (isDevelopment) {
        console.log(chalk.blue(`[INFO] Database schema version: ${version}`));
    } else {
        console.log(JSON.stringify(['[INFO] Database schema version:', version]));
    }
};
