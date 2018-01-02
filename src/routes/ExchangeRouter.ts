/**
 * Created by DickyShi on 12/17/17.
 */
import { Router, Request, Response, NextFunction} from 'express';
import { Exchange, Binance, Gate, Huobi, OKex, ZB } from '../lib/index';
import * as querystring from 'querystring';

const keys = require('../keys');

interface Exchanges {
    [key: string]: Exchange
}

const exchanges: Exchanges = {
    'gate.io': new Gate,
    'okex': new OKex,
    'binance': new Binance,
    'huobi': new Huobi,
    'zb': new ZB
};

export class ExchangeRouter {
    router: Router;
    cachedPrices: any;

    constructor() {
        this.router = Router();
        this.cachedPrices = {};
        for (let exchange of Object.keys(exchanges)) {
            this.cachedPrices[exchange] = {};
        }
        this.init();
    }

    public getExchangeBalance = (req: Request, res: Response, next: NextFunction) => {
        let query = req.params.name;
        let exchange = exchanges[query];
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

    private reflect(promise: Promise) {
        return promise.then(
            (v: any) => { return {v:v, status: 1} },
            (e: any) => { return {e:e, status: -1} }
        );
    };

    public getAllExchangePrice = (req: Request, res: Response, next: NextFunction) => {
        let pair = req.params.pair;
        let data:any = {};
        let promises = [];
        for (let exchange of Object.keys(exchanges)) {
            promises.push(new Promise((resolve: Function, reject: Function) => {
                exchanges[exchange].getPrice(pair,
                    (result: any) => {
                        // console.log(exchange + querystring.stringify(result));
                        if (result['code'] === 1) {
                            data[exchange] = Number(result['data']);
                            resolve();
                        } else {
                            reject();
                        }
                    });
            }));
        }
        Promise.all(promises.map(this.reflect)).then(() => {
            // console.log(data);
            res.status(200)
                .send(data);
        }).catch(
            (reason: any) => {
                // console.log(data);
                res.status(404)
                    .send(data);
            }
        );
    };

    public getExchangePrice = (req: Request, res: Response, next: NextFunction) => {
        let name = req.params.name;
        let pair = req.params.pair;
        let exchange = exchanges[name];
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
