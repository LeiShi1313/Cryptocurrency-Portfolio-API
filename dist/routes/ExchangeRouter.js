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
            let query = req.params.name;
            let exchange = exchanges[query];
            let key = keys[query]['apiKey'];
            let secret = keys[query]['secretKey'];
            if (exchange) {
                exchange.getBalance(key, secret, (result) => {
                    if (result['code'] === 1) {
                        res.status(200)
                            .send(result['data']);
                    }
                    else {
                        res.status(404)
                            .send(result);
                    }
                });
            }
            else {
                res.status(404)
                    .send({
                    message: `Exchange ${query} not found!`
                });
            }
        };
        this.getAllExchangePrice = (req, res, next) => {
            let pair = req.params.pair;
            let data = {};
            let promises = [];
            for (let exchange of Object.keys(exchanges)) {
                promises.push(new Promise((resolve, reject) => {
                    exchanges[exchange].getPrice(pair, (result) => {
                        // console.log(exchange + querystring.stringify(result));
                        if (result['code'] === 1) {
                            data[exchange] = Number(result['data']);
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
            let exchange = exchanges[name];
            if (exchange) {
                exchange.getPrice(pair, (result) => {
                    if (result['code'] === 1) {
                        this.cachedPrices[name][pair] = Number(result['data']);
                        console.log(result);
                        res.status(200)
                            .send({
                            'price': Number(result['data']),
                            'legacy': false
                        });
                    }
                    else if (this.cachedPrices[name][pair]) {
                        res.status(200)
                            .send({
                            'price': this.cachedPrices[name][pair],
                            'legacy': true
                        });
                    }
                    else {
                        res.status(404)
                            .send(result);
                    }
                });
            }
        };
        this.router = express_1.Router();
        this.cachedPrices = {};
        for (let exchange of Object.keys(exchanges)) {
            this.cachedPrices[exchange] = {};
        }
        this.init();
    }
    reflect(promise) {
        return promise.then((v) => { return { v: v, status: 1 }; }, (e) => { return { e: e, status: -1 }; });
    }
    ;
    init() {
        this.router.get('/all/ticker/:pair', this.getAllExchangePrice);
        this.router.get('/:name/balance', this.getExchangeBalance);
        this.router.get('/:name/ticker/:pair', this.getExchangePrice);
    }
}
exports.ExchangeRouter = ExchangeRouter;
const exchangeRoutes = new ExchangeRouter();
exchangeRoutes.init();
exports.default = exchangeRoutes.router;
