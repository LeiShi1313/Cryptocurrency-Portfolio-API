"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by DickyShi on 12/17/17.
 */
const express_1 = require("express");
const index_1 = require("../lib/index");
const keys = require('../keys');
const exchanges = {
    'gate.io': new index_1.Gate,
    'okex': new index_1.OKex,
    'binance': new index_1.Binance,
    'huobi': new index_1.Huobi,
    'zb': new index_1.ZB,
    'cryptopia': new index_1.Cryptopia
};
class ExchangeRouter {
    constructor() {
        this.getExchangeBalance = (req, res, next) => {
            let name = req.params.name;
            this._getExchangeBalance(name)
                .then((result) => {
                res.status(200)
                    .send(result['data']);
            })
                .catch((reason) => {
                res.status(404)
                    .send(reason);
            });
        };
        this.getAllExchangeBalance = (req, res, next) => {
            for (let exchange of Object.keys(exchanges)) {
            }
        };
        this.getAllExchangePrice = (req, res, next) => {
            let pair = req.params.pair;
            let data = {};
            let promises = [];
            for (let exchange of Object.keys(exchanges)) {
                promises.push(new Promise((resolve, reject) => {
                    exchanges[exchange].getPrice(pair)
                        .then((result) => {
                        if (result['code'] === 1) {
                            data[exchange] = result['data'];
                            resolve();
                        }
                        else {
                            reject();
                        }
                    });
                }));
            }
            Promise.all(promises.map(this.reflect)).then(() => {
                // console.log(data);
                res.status(200)
                    .send(data);
            }).catch((reason) => {
                // console.log(data);
                res.status(404)
                    .send(data);
            });
        };
        this.getExchangePrice = (req, res, next) => {
            let name = req.params.name;
            let pair = req.params.pair;
            this._getExchangePrice(name, pair)
                .then((result) => {
                this.cachedPrices[name][pair] = Number(result['data']);
                res.status(200)
                    .send({
                    'price': Number(result['data']),
                    'legacy': false
                });
            })
                .catch((reason) => {
                console.log(reason);
                if (this.cachedPrices[name][pair]) {
                    res.status(200)
                        .send({
                        'price': this.cachedPrices[name][pair],
                        'legacy': true
                    });
                }
                else {
                    res.status(404)
                        .send(reason);
                }
            });
        };
        this.router = express_1.Router();
        this.cachedPrices = {};
        for (let exchange of Object.keys(exchanges)) {
            this.cachedPrices[exchange] = {};
        }
        this.init();
    }
    _getExchangeBalance(name) {
        let ret;
        let exchange = exchanges[name];
        if (exchange) {
            let key = keys[name]['apiKey'];
            let secret = keys[name]['secretKey'];
            ret = exchange.getBalance(key, secret);
        }
        else {
            ret = Promise.reject({
                'code': -9999,
                'message': `Exchange ${name} not found!`,
                'data': []
            });
        }
        return ret;
    }
    _getExchangePrice(name, pair) {
        let ret;
        let exchange = exchanges[name];
        if (exchange) {
            ret = exchange.getPrice(pair);
        }
        else {
            ret = Promise.reject({
                'code': -9999,
                'message': `Exchange ${name} not found!`,
                'data': []
            });
        }
        return ret;
    }
    reflect(promise) {
        return promise.then((v) => { return { v: v, status: 1 }; }, (e) => { return { e: e, status: -1 }; });
    }
    ;
    init() {
        this.router.get('/ticker/all/:pair', this.getAllExchangePrice);
        this.router.get('/ticker/:name/:pair', this.getExchangePrice);
        this.router.get('/balance/all', this.getAllExchangeBalance);
        this.router.get('/balance/:name', this.getExchangeBalance);
    }
}
exports.ExchangeRouter = ExchangeRouter;
const exchangeRoutes = new ExchangeRouter();
exchangeRoutes.init();
exports.default = exchangeRoutes.router;
