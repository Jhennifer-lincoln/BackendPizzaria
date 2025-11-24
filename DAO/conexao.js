import mysql from 'mysql2/promise';

export default async function conectar() {

    if (global.poolConexoes) {
        return await global.poolConexoes.getConnection();
    }
    else {
        const pool = await mysql.createPool({
            host: '132.226.245.178',
            port: 3306,
            user: '10442417480',
            database: 'PFS2_10442417480',
            password: '10442417480', 
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10, 
            idleTimeout: 60000, 
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        })

        global.poolConexoes = pool;
        return await global.poolConexoes.getConnection();
    }

}