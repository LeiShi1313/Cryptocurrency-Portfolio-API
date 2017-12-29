import * as axios from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

const API_URL = 'https://data.gate.io/';
const PAIRS_URL = 'api2/1/pairs';
const MARKETINFO_URL = 'api2/1/marketinfo';
const MARKETLIST_URL = 'api2/1/marketlist';
const TICKERS_URL = 'api2/1/tickers';
const TICKER_URL = 'api2/1/ticker';
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

const USER_AGENT = '';


function getSign(form: object, secret: string) {
    return crypto.createHmac('sha512', secret).update(form).digest('hex').toString();
}

interface Headers {
    [key: string]: string;
}

let gate = {
    getPrice: function(pair: string, callback: Function) {
        return axios({
            method: 'GET',
            url: API_URL + TICKER_URL + '/' + pair
        }).then(
            (res: any) => {
                if (res.data['result'] === 'true') {
                    callback({
                        code: 1,
                        data: res.data['last']
                    })
                } else {
                    callback({
                        code: res.data['code'],
                        message: res.data['message'],
                        data: ''
                    })
                }

            }
        ).catch(
            (reason: any) => {
                console.log(reason);
                callback({
                    code: -1,
                    data: ''
                })
            }
        )
    },

    getBalance: function(key: string, secret: string, callback: Function) {
        let form = {};
        let header: Headers = {};
        header.KEY = key;
        header.SIGN = getSign(querystring.stringify(form), secret);
        console.log(header);
        console.log(form);
        return axios({
            method: 'POST',
            url: API_URL + BALANCE_URL,
            headers: header,
            form: form
        }).then(
            (res: any) => {
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
                } else {
                    callback({
                        code: res.data['code'],
                        message: res.data['message'],
                        data: []
                    })
                }
            }
        ).catch(
            (reason: any) => {
                console.log(reason);
            });
    }
};


export default gate;
