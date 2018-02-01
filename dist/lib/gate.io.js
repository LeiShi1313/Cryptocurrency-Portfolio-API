"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");
const PAIRS_URL = 'api2/1/pairs';
const MARKETINFO_URL = 'api2/1/marketinfo';
const MARKETLIST_URL = 'api2/1/marketlist';
const TICKERS_URL = 'api2/1/tickers';
const ORDERBOOKS_URL = 'api2/1/orderBooks';
const ORDERBOOK_URL = 'api2/1/orderBook';
const TRADEHISTORY_URL = 'api2/1/tradeHistory';
const BALANCE_URL = 'api2/1/private/balances';
const DEPOSITADDRESS_URL = 'api2/1/private/depositAddress';
const DEPOSITSWITHDRAWALS_URL = 'api2/1/private/depositsWithdrawals';
const BUY_URL = 'api2/1/private/buy';
const CANCELORDER_URL = 'api2/1/private/cancelOrder';
const CANCELALLORDERS_URL = 'api2/1/private/cancelAllOrders';
const GETORDER_URL = 'api2/1/private/getOrder';
const OPENORDERS_URL = 'api2/1/private/openOrders';
const MYTRADEHISTORY_URL = 'api2/1/private/tradeHistory';
const WITHDRAW_URL = 'api2/1/private/withdraw';
class Gate {
    constructor() {
        this.API_URL = 'https://data.gate.io/';
        this.TICKER_URL = 'api2/1/ticker';
        this.BALANCE_URL = 'api2/1/private/balances';
    }
    sign(params, secret) {
        return crypto.createHmac('sha512', secret).update(params).digest('hex').toString();
    }
    getPrice(pair, callback) {
        axios_1.default({
            method: 'GET',
            url: this.API_URL + this.TICKER_URL + '/' + pair
        }).then((res) => {
            if (res.data['result'] === 'true') {
                callback({
                    code: 1,
                    data: res.data['last']
                });
            }
            else {
                callback({
                    code: res.data['code'],
                    message: res.data['message'],
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
        let params = {};
        let header = {};
        header.KEY = key;
        header.SIGN = this.sign(querystring.stringify(params), secret);
        console.log(header);
        console.log(params);
        axios_1.default({
            method: 'POST',
            url: this.API_URL + this.BALANCE_URL,
            headers: header,
            form: params
        }).then((res) => {
            if (res.data['result'] === 'true') {
                let data = [];
                for (let status of ['available', 'locked']) {
                    if (res.data[status]) {
                        for (let [symbol, amount] of Object.entries(res.data[status])) {
                            data.push({
                                symbol: symbol.toUpperCase(),
                                amount: amount,
                                status: status
                            });
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
                    message: res.data['message'],
                    data: []
                });
            }
        }).catch((reason) => {
            console.log(reason);
        });
    }
}
exports.Gate = Gate;
