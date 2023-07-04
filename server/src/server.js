import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

import rootRouter from './routers';

const server = async (initDB=false) => {
    const app = express();
    const port = 10801;
    const __dirname = path.resolve();

    app.use(cors({
        origin: '*', 
    }));
    
    app.use(bodyParser.json());
    app.use('/', rootRouter);  
    
    app.set('port', port);
    app.listen(port);
};

export default server;