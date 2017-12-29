/**
 * Created by DickyShi on 12/17/17.
 */
import {Router, Request, Response, NextFunction} from 'express';
import GateIO from '../lib/gate.io';
import OKEX from '../lib/okex';
import BINANCE from '../lib/binance';
import HUOBI from '../lib/huobi';
import ZB from '../lib/zb';

const keys = require('../keys');

const Exchanges = {
    'gate.io': GateIO,
    'okex': OKEX,
    'binance': BINANCE,
    'huobi': HUOBI,
    'zb': ZB
};


export class ExchangeRouter {
    router: Router;
    cachedPrices: any;

    constructor() {
        this.router = Router();
        this.cachedPrices = {};
        for (let exchange of Object.keys(Exchanges)) {
            this.cachedPrices[exchange] = {};
        }
        this.init();
    }

    public getExchangeBalance = (req: Request, res: Response, next: NextFunction) => {
        let query = req.params.name;
        let exchange = Exchanges[query];
        let key = keys[query]['apiKey'];
        let secret = keys[query]['secretKey'];
        if (exchange) {
            exchange.getBalance(key, secret,
                (result: any) => {
                    if (result['code'] === 1) {
                        res.status(200)
                            .send(result['data']);
                    } else {
                        res.status(404)
                            .send(result);
                    }
            });
        } else {
            res.status(404)
                .send({
                    message: `Exchange ${query} not found!`
                });
        }
    };

    public getAllExchangePrice = (req: Request, res: Response, next: NextFunction) => {
        let pair = req.params.pair;
        let data = {};
        let promises = [];
        console.log('hi');
        for (let exchange of Object.keys(Exchanges)) {
            console.log(exchange);
            promises.push(new Promise((resolve: Function, reject: Function) => {
                Exchanges[exchange].getPrice(pair,
                    (result: any) => {
                        console.log(result);
                        if (result['code'] === 1) {
                            data[exchange] = Number(result['data']);
                        }
                        resolve();
                    });
            }));
        }
        Promise.all(promises).then(() => {
            res.status(200)
                .send(data);
        })
    };

    public getExchangePrice = (req: Request, res: Response, next: NextFunction) => {
        let name = req.params.name;
        let pair = req.params.pair;
        let exchange = Exchanges[name];
        if (exchange) {
            exchange.getPrice(pair,
                (result: any) => {
                    if (result['code'] === 1) {
                        this.cachedPrices[name][pair] = Number(result['data']);
                        console.log(result);
                        res.status(200)
                            .send({
                                'price': Number(result['data']),
                                'legacy': false
                            });
                    } else if (this.cachedPrices[name][pair]) {
                        res.status(200)
                            .send({
                                'price': this.cachedPrices[name][pair],
                                'legacy': true
                            });
                    } else {
                        res.status(404)
                            .send(result);
                    }
                })
        }
    };


    init() {
        this.router.get('/all/ticker/:pair', this.getAllExchangePrice);
        this.router.get('/:name/balance', this.getExchangeBalance);
        this.router.get('/:name/ticker/:pair', this.getExchangePrice);
    }
}

const exchangeRoutes = new ExchangeRouter();
exchangeRoutes.init();

export default exchangeRoutes.router;
