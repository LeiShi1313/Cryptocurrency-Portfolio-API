"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");
class Huobi {
    constructor() {
        this.METHOD = 'https://';
        this.API_URL = 'api.huobi.pro';
        this.BALANCE_URL = '/v1/account/accounts/587976/balance';
        this.MARKET_DETAIL = '/market/detail/merged';
    }
    sorted(o) {
        let p = Object.create(null);
        for (const k of Object.keys(o).sort())
            p[k] = o[k];
        return p;
    }
    sign(method, api_url, method_url, params, secret) {
        let formattedParams = querystring.stringify(this.sorted(params));
        let totalParams = method + '\n' + api_url + '\n' + method_url + '\n' + formattedParams;
        console.log(totalParams);
        let sha256String = crypto.createHmac('sha256', secret).update(totalParams).digest();
        console.log(sha256String);
        return new Buffer(sha256String).toString('base64');
    }
    getPrice(pair, callback) {
        let pairs = pair.split('_');
        let params = {
            'symbol': pairs.map(p => p.toLowerCase()).join("")
        };
        let headers = {
            'Content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        };
        axios_1.default({
            method: 'GET',
            url: this.METHOD + this.API_URL + this.MARKET_DETAIL,
            headers: headers,
            params: params
        }).then((res) => {
            if (res.data['status'] === 'ok') {
                callback({
                    code: 1,
                    data: res.data['tick']['close']
                });
            }
            else {
                callback({
                    code: res.data['err-code'],
                    message: res.data['err-msg'],
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
        let params = {
            'SignatureMethod': 'HmacSHA256',
            'SignatureVersion': '2',
            'AccessKeyId': key,
            'Timestamp': new Date().toISOString().split('.')[0],
        };
        let headers = {
            'Content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        };
        params['Signature'] = this.sign('GET', this.API_URL, this.BALANCE_URL, params, secret);
        axios_1.default({
            method: 'GET',
            url: this.METHOD + this.API_URL + this.BALANCE_URL,
            headers: headers,
            params: params
        }).then((res) => {
            console.log(res.data);
            if (res.data['status'] === 'ok') {
                let data = [];
                let list = res.data['data']['list'];
                for (let asset of list) {
                    if (asset['balance'] != 0.0) {
                        data.push({
                            symbol: asset['currency'].toUpperCase(),
                            amount: asset['balance'],
                            status: asset['type']
                        });
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
            console.log(reason);
            callback({
                code: -1,
                message: reason,
                data: []
            });
        });
    }
}
exports.Huobi = Huobi;
