/**
 * Created by DickyShi on 12/17/17.
 */
import axios, { AxiosResponse } from "axios";
import * as crypto from 'crypto';

import { Exchange, Params} from './exchange';

const API_URL = 'https://api.binance.com';
const USER_DATA = '/api/v3/account';
const PRICE = '/api/v3/ticker/price';


function formatParam(params: Params): string {
    let formattedParams: string = '';

    let sortedKeys:string[] = Object.keys(params).sort();

    for (var i = 0; i < sortedKeys.length; i++) {
        if (i != 0) {
            formattedParams += '&';
        }
        let key = params[sortedKeys[i]];
        formattedParams += sortedKeys[i] + '=' + key;
    }
    return formattedParams
}

function sign(params: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(params).digest('hex').toString();
}

export class Binance implements Exchange {
    public getPrice(pair: string, callback: Function) {
        let pairs = pair.split('_');
        let params: Params = {
            'symbol': pairs.map(p => p.toUpperCase()).join("")
        };
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        axios({
            method: 'GET',
            url: API_URL + PRICE,
            headers: headers,
            params: params
        }).then(
            (res: AxiosResponse) => {
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
        ).catch(
            (reason: any) => {
                callback({
                    code: -1,
                    data: []
                })
            }
        );
    }
    getBalance(key: string, secret: string, callback: Function) {
        let headers = {
            'X-MBX-APIKEY': key,
            'Content-type': 'application/x-www-form-urlencoded'
        };
        let params: Params = {
            timestamp: new Date().getTime()
        };
        params['signature'] = sign(formatParam(params), secret);
        axios({
            method: 'GET',
            url: API_URL + USER_DATA,
            headers: headers,
            params: params
        }).then(
            (res: AxiosResponse) => {
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
}

