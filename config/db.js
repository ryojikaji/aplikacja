import mssql from 'mssql'

const pool = await mssql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    },
    pool: {
        max: +process.env.DB_MAX_POOL || 10,
    }
})

export default pool