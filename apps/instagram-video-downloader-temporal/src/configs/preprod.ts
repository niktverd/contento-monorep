export const dbConfig = {
    client: 'pg',
    connection: {
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DATABASE_NAME || 'postgresql',
        user: process.env.POSTGRES_USER || 'app_user',
        port: process.env.POSTGRES_PORT || 5432,
        ssl: false, //   ssl: {rejectUnauthorized: false},
    },
    pool: {
        min: 2,
        max: 10,
    },
};