import * as axios from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

const API_URL = 'https://trade.zb.com/';
const ACCOUNT_INFO = 'api/getAccountInfo';
const MARKET_URL = 'http://api.zb.com/';
const TICKER_URL = 'data/v1/ticker';

function sorted(o: object) {
    let p = Object.create(null);
    for (const k of Object.keys(o).sort()) p[k] = o[k];
    return p;
}

function sign(params: object, secret: string): string {
    let sortedParams = querystring.stringify(sorted(params));
    console.log(sortedParams);
    let sha1SecretKey = crypto.createHash('sha1').update(secret).digest('hex');
    return crypto.createHmac('md5', sha1SecretKey).update(sortedParams).digest('hex');
}

let zb = {
    getPrice: function(pair:string, callback: Function) {
        let prams = {
            'market': pair
        };
        return axios({
            method: 'GET',
            url: MARKET_URL + TICKER_URL,
            params: prams
        }).then(
            (res: any) => {
                if (!res.data['error']) {
                    callback({
                        code: 1,
                        data: res.data['ticker']['last']
                    })
                } else {
                    callback({
                        code: -1,
                        message: res.data['error'],
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
        let params = {
            'accesskey': key,
            'method': 'getAccountInfo'
        };
        let headers = {};
        params['sign'] = sign(params, secret);
        params['reqTime'] = new Date().getTime();
        console.log(params);
        return axios({
            method: 'GET',
            url: API_URL + ACCOUNT_INFO,
            headers: headers,
            params: params
        }).then(
            (res:any) => {
                if (res.status === 200) {
                    let coins = res.data['result']['coins'];
                    let data = [];
                    for (let coin of coins) {
                        if (coin['available'] != 0.0) {
                            data.push({
                                symbol: coin['enName'],
                                amount: coin['available'],
                                status: 'free'
                            });
                        }
                        if (coin['freez'] != 0.0) {
                            data.push({
                                symbol: coin['enName'],
                                amount: coin['freez'],
                                status: 'locked'
                            });
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
                    });
                }
            }).catch(
            (reason: any) => {
                console.log(reason);
                callback({
                    code: -1,
                    message: "",
                    data: []
                });
            }
        )
    }

};

export default zb;
