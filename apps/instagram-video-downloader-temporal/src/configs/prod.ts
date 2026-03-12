export const dbConfig = {
    client: 'pg',
    connection: {
        host: process.env.POSTGRES_HOST || 'srv-captain--contario-app-db',
        dbName: process.env.POSTGRES_DATABASE_NAME || 'contario',
        user: process.env.POSTGRES_USER || 'contario-user',
        port: process.env.POSTGRES_PORT || 5432,
        ssl: false, //   ssl: {rejectUnauthorized: false},
    },
    pool: {
        min: 2,
        max: 100,
    },
};
