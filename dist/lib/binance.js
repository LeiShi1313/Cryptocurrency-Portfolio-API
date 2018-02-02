"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");
class Binance {
    constructor() {
        this.API_URL = 'https://api.binance.com';
        this.USER_DATA = '/api/v3/account';
        this.PRICE = '/api/v3/ticker/price';
    }
    sign(params, secret) {
        return crypto.createHmac('sha256', secret).update(params).digest('hex').toString();
    }
    getPrice(pair) {
        let pairs = pair.split('_');
        let params = {
            'symbol': pairs.map(p => p.toUpperCase()).join("")
        };
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        const result = axios_1.default({
            method: 'GET',
            url: this.API_URL + this.PRICE,
            headers: headers,
            params: params
        }).then((res) => {
            console.log(res.data);
            if (res.status === 200) {
                return {
                    code: 1,
                    data: res.data['price']
                };
            }
            else {
                throw {
                    code: res.data['code'],
                    message: res.data['msg'],
                    data: []
                };
            }
        }).catch((reason) => {
            if (reason['code']) {
                throw reason;
            }
            else {
                const data = reason.response.data;
                if (data) {
                    throw {
                        code: data.code,
                        message: data.msg,
                        data: []
                    };
                }
                else {
                    throw {
                        code: -1,
                        data: []
                    };
                }
            }
        });
        return result;
    }
    getBalance(key, secret) {
        let headers = {
            'X-MBX-APIKEY': key,
            'Content-type': 'application/x-www-form-urlencoded'
        };
        let params = {
            timestamp: new Date().getTime()
        };
        params['signature'] = this.sign(querystring.stringify(params), secret);
        const result = axios_1.default({
            method: 'GET',
            url: this.API_URL + this.USER_DATA,
            headers: headers,
            params: params
        }).then((res) => {
            if (res.status === 200) {
                let data = [];
                for (let asset of res.data['balances']) {
                    if (asset['free'] != 0.0) {
                        data.push({
                            symbol: asset['asset'],
                            amount: asset['free'],
                            status: 'free'
                        });
                    }
                    if (asset['locked'] != 0.0) {
                        data.push({
                            symbol: asset['asset'],
                            amount: asset['locked'],
                            status: 'locked'
                        });
                    }
                }
                return {
                    code: 1,
                    data: data
                };
            }
            else {
                throw {
                    code: res.data['code'],
                    message: res.data['msg'],
                    data: []
                };
            }
        })
            .catch((reason) => {
            if (reason['code']) {
                throw reason;
            }
            else {
                throw {
                    code: -1,
                    data: []
                };
            }
        });
        return result;
    }
}
exports.Binance = Binance;
