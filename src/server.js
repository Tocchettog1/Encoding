require('dotenv').config({  
    path: process.env.NODE_ENV === "dev" ? ".env.development" : ".env"
})

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import config from './config/general'
import https from 'https';
import path from "path";
import fs from 'fs';

//-------------- Config

const rootPath = path.join(__dirname, '../')

var options = {
	key: fs.readFileSync(`${rootPath}/ssl/private.key`),
	ca: fs.readFileSync(`${rootPath}/ssl/ca.crt`),
	cert: fs.readFileSync(`${rootPath}/ssl/cert.crt`)
  };

const app = express();


//Standard return format is set to JSON.    
app.use(express.json());

//Security policies.
app.use(cors([]));

//Using morgan resquest log handler.
app.use(morgan('dev'));

//Routes.
app.use(routes);

//-------------- Runner

const appS = https.createServer(options, app)

//Application running port.  
appS.listen(config.port, () => {
    try {
        console.log(`Server (v${config.version}) running on ${config.port} over SSL [OK]`);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    process.on('SIGTERM', () => {
        // console.log('Received SIGTERM');
        shutdown();
    });
       
    process.on('SIGINT', () => {
        // console.log('Received SIGINT');
        shutdown();
    });
       
    process.on('uncaughtException', err => {
        console.log('Uncaught exception');
        console.error(err);
        shutdown(err);
    }); 
})

//Shutdown function
async function shutdown(e) {
    let err = e;     
    console.log('Shutting down...');
    try {
        console.log('Closing database module...');
    } catch (err) {
        console.log('Encountered error', e);    
        err = err || e;
    }  
    console.log('Exiting process...');   
    if (err) {
      process.exit(1); // Non-zero failure code
    } else {
      process.exit(0);
    }
}