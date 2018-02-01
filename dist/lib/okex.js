"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");
class OKex {
    constructor() {
        this.API_URL = 'https://www.okex.com/';
        this.USER_INFO = '/api/v1/userinfo.do';
        this.TICKER_URL = '/api/v1/ticker.do';
    }
    sorted(o) {
        let p = Object.create(null);
        for (const k of Object.keys(o).sort())
            p[k] = o[k];
        return p;
    }
    sign(params, secret) {
        let formattedParams = querystring.stringify(this.sorted(params));
        formattedParams += '&secret_key=' + secret;
        return crypto.createHash('md5').update(formattedParams).digest('hex').toUpperCase();
    }
    getPrice(pair, callback) {
        let prams = {
            'symbol': pair
        };
        axios_1.default({
            method: 'GET',
            url: this.API_URL + this.TICKER_URL,
            params: prams
        }).then((res) => {
            if (res.status === 200) {
                callback({
                    code: 1,
                    data: res.data['ticker']['last']
                });
            }
            else {
                callback({
                    code: res.data['error_code'],
                    message: '',
                    data: ''
                });
            }
        }).catch((reason) => {
            callback({
                code: -1,
                data: ''
            });
        });
    }
    getBalance(key, secret, callback) {
        let form = {};
        form['api_key'] = key;
        form['sign'] = this.sign(form, secret);
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        console.log(form);
        axios_1.default({
            method: 'POST',
            url: this.API_URL + this.USER_INFO,
            headers: headers,
            data: querystring.stringify(form)
        }).then((res) => {
            if (res.data['result'] === true) {
                let data = [];
                let funds = res.data['info']['funds'];
                for (let status of ['free', 'freezed']) {
                    if (funds[status]) {
                        for (let [symbol, amount] of Object.entries(funds[status])) {
                            if (amount != 0 && symbol != 'bcc') {
                                data.push({
                                    symbol: symbol.toUpperCase(),
                                    amount: amount,
                                    status: status
                                });
                            }
                        }
                    }
                }
                callback({
                    code: 1,
                    data: data
                });
            }
            else {
                callback({
                    code: res.data['code'],
                    message: res.data['error_code'],
                    data: []
                });
            }
        }).catch((reason) => {
            callback({
                code: -1,
                message: reason,
                data: []
            });
        });
    }
}
exports.OKex = OKex;
