import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

import HeroRouter from './routes/HeroRouter';
import ExchangeRouter from './routes/ExchangeRouter';

class App {
    public express: express.Application;

    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false}));
        this.express.use(cors());
    }

    private routes(): void {
        this.express.use(express.static(path.join(__dirname, '../public')));
        this.express.use('/api/v1/heroes', HeroRouter);
        this.express.use('/api/v1/', ExchangeRouter);
    }
}

export default new App().express;
