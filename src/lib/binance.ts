/**
 * Created by DickyShi on 12/17/17.
 */
import * as axios from 'axios';
import * as crypto from 'crypto';

const API_URL = 'https://api.binance.com';
const USER_DATA = '/api/v3/account';
const PRICE = '/api/v3/ticker/price';

function formatParam(params: object): string {
    let formattedParams: string = '';

    let sortedKeys:string[] = Object.keys(params).sort();

    for (var i = 0; i < sortedKeys.length; i++) {
        if (i != 0) {
            formattedParams += '&';
        }
        formattedParams += sortedKeys[i] + '=' + params[sortedKeys[i]];
    }
    return formattedParams
}

function sign(params: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(params).digest('hex').toString();
}

let binance = {
    getPrice: function(pair: string, callback: Function) {
        let pairs = pair.split('_');
        let params = {
            'symbol': pairs.map(p => p.toUpperCase()).join("")
        };
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        return axios({
            method: 'GET',
            url: API_URL + PRICE,
            headers: headers,
            params: params
        }).then(
            (res: any) => {
                if (res.status === 200) {
                    callback({
                        code: 1,
                        data: res.data['price']
                    })
                } else {
                    callback({
                        code: res.data['code'],
                        message: res.data['msg'],
                        data: []
                    });
                }
            }
        )
    },

    getBalance: function(key: string, secret: string, callback: Function) {
        let headers = {
            'X-MBX-APIKEY': key,
            'Content-type': 'application/x-www-form-urlencoded'
        };
        let params = {
            timestamp: new Date().getTime()
        };
        params['signature'] = sign(formatParam(params), secret);
        return axios({
            method: 'GET',
            url: API_URL + USER_DATA,
            headers: headers,
            params: params
        }).then(
            (res: any) => {
                if (res.status === 200) {
                    let data = [];
                    for (let asset of res.data['balances']) {
                        if (asset['free'] != 0.0) {
                            data.push({
                                symbol: asset['asset'],
                                amount: asset['free'],
                                status: 'free'
                            })
                        }
                        if (asset['locked'] != 0.0) {
                            data.push({
                                symbol: asset['asset'],
                                amount: asset['locked'],
                                status: 'locked'
                            })
                        }
                    }
                    callback({
                        code: 1,
                        data: data
                    });
                } else {
                    callback({
                        code: res.data['code'],
                        message: res.data['msg'],
                        data: []
                    });
                }
            })
            .catch(
                (reason: any) => {
                    console.log(reason);
                    callback({
                        code: -1,
                        data: []
                    })
                }
            );
    }
};

export default binance;
