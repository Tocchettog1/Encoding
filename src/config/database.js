import knex from 'knex';
const { attachPaginate  } = require('knex-paginate');

const aulalivreConfig = {
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_SCHEMA,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        requestTimeOut: 50000
    },
    debug: false,
}

export const aulaDB = knex(aulalivreConfig);

//Plugin de paginação
attachPaginate();