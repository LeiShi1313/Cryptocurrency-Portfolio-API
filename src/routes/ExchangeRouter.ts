/**
 * Created by DickyShi on 12/17/17.
 */
import { Router, Request, Response, NextFunction} from 'express';
import { Exchange, Data, Binance, Gate, Huobi, OKex, ZB, Cryptopia } from '../lib/index';
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
    'zb': new ZB,
    'cryptopia': new Cryptopia
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

    private _getExchangeBalance (name: string): Promise<Data> {
        let ret: Promise<Data>;
        let exchange = exchanges[name];
        if (exchange) {
            let key = keys[name]['apiKey'];
            let secret = keys[name]['secretKey'];
            ret = exchange.getBalance(key, secret);
        } else {
            ret = Promise.reject({
                'code': -9999,
                'message': `Exchange ${name} not found!`,
                'data': []
            })
        }
        return ret;
    }

    private _getExchangePrice (name: string, pair: string): Promise<Data> {
        let ret: Promise<Data>;
        let exchange = exchanges[name];
        if (exchange) {
            ret = exchange.getPrice(pair);
        } else {
            ret = Promise.reject({
                'code': -9999,
                'message': `Exchange ${name} not found!`,
                'data': []
            })
        }
        return ret;
    }

    public getExchangeBalance = (req: Request, res: Response, next: NextFunction) => {
        let name = req.params.name;
        this._getExchangeBalance(name)
        .then((result: Data) => {
            res.status(200)
            .send(result['data']);
        })
        .catch((reason: any) => {
            res.status(404)
            .send(reason);
        })
    };

    public getAllExchangeBalance = (req: Request, res: Response, next: NextFunction) => {
        for (let exchange of Object.keys(exchanges)) {

        }
    }

    private reflect(promise: Promise<any>) {
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
            promises.push(new Promise(
                (resolve: Function, reject: Function) => {
                    exchanges[exchange].getPrice(pair)
                        .then((result: Data) => {
                            if (result['code'] === 1) {
                                data[exchange] = result['data']
                                resolve();
                            } else {
                                reject();
                            }
                        });
                }
            ));
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
        this._getExchangePrice(name, pair)
        .then((result: Data) => {
            this.cachedPrices[name][pair] = Number(result['data']);
            res.status(200)
            .send({
                'price': Number(result['data']),
                'legacy': false
            });
        })
        .catch((reason: any) => {
            console.log(reason);
            if (this.cachedPrices[name][pair]) {
                res.status(200)
                .send({
                    'price': this.cachedPrices[name][pair],
                    'legacy': true
                });
            } else {
                res.status(404)
                .send(reason);
            }
        });
    };


    init() {
        this.router.get('/ticker/all/:pair', this.getAllExchangePrice);
        this.router.get('/ticker/:name/:pair', this.getExchangePrice);
        this.router.get('/balance/all', this.getAllExchangeBalance);
        this.router.get('/balance/:name', this.getExchangeBalance);
    }
}

const exchangeRoutes = new ExchangeRouter();
exchangeRoutes.init();

export default exchangeRoutes.router;
