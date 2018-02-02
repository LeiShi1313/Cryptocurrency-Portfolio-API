import axios, { AxiosResponse } from "axios";
import * as crypto from 'crypto';

import { Exchange, Data, Balance, Params} from './exchange';
import * as querystring from "querystring";
import { connect } from "http2";

export class Cryptopia implements Exchange {
    private API_URL = 'https://www.cryptopia.co.nz';
    private GET_BALANCE = '/Api/GetBalance';
    private GET_MARKET = '/Api/GetMarket';

    private sign(method: string, params: Params, key: string, secret: string) {
        let paramsStr = querystring.stringify(params) || '{}';
        console.log(paramsStr);
        let nonce = Math.floor(new Date().getTime() / 1000);
        console.log("nonce: " + nonce);
        let base64 = crypto.createHash('md5').update(paramsStr).digest().toString('base64');
        console.log("base64: " + base64);
        let signature = key + "POST" + querystring.escape(this.API_URL + method).toLowerCase() + nonce + base64;
        console.log("signature: " + signature);
        return crypto.createHmac('sha256', new Buffer( secret, "base64" ) ).update( signature ).digest().toString('base64') + ':' + nonce;
    };

    public getPrice(pair: string): Promise<Data> {
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        const result = axios({
            method: 'GET',
            url: this.API_URL + this.GET_MARKET + '/' + pair.toUpperCase(),
            headers: headers,
        }).then(
            (res: AxiosResponse) => {
                if (res.data['Success'] === true && res.data['Data']) {
                    return {
                        code: 1,
                        data: res.data['Data']['Close']
                    }
                } else {
                    throw {
                        code: -1,
                        message: res.data['Error'],
                        data: []
                    };
                }
            }
        ).catch(
            (reason: any) => {
                if (reason['code']) {
                    throw reason;
                } else {
                    throw {
                        code: -1,
                        data: []
                    };
                }
            }
        );
        return result;
    }
    getBalance(key: string, secret: string): Promise<Data> {
        let params: Params = {};
        let signature = this.sign("/Api/GetBalance", params, key, secret);
        let headers = {
            'Authorization': "amx " + key + ':' + signature,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(JSON.stringify(params))
        };
        console.log("header: " + JSON.stringify(headers, null, 4));
        const result = axios({
            method: 'POST',
            url: this.API_URL + this.GET_BALANCE,
            headers: headers,
            data: '{}'
        }).then(
            (res: AxiosResponse) => {
                if (res.data['Success'] === true) {
                    let data = [];
                    for (let asset of res.data['Data']) {
                        if (asset['Available'] != 0.0) {
                            data.push({
                                symbol: asset['Symbol'],
                                amount: asset['Available'],
                                status: 'free'
                            })
                        }
                        if (asset['HeldForTrades'] != 0.0) {
                            data.push({
                                symbol: asset['Symbol'],
                                amount: asset['HeldForTrades'],
                                status: 'locked'
                            })
                        }
                    }
                    return {
                        code: 1,
                        data: data
                    };
                } else {
                    throw {
                        code: -1,
                        message: res.data['message'],
                        data: []
                    };
                }
            })
            .catch(
                (reason: any) => {
                    if (reason['code']) {
                        throw reason;
                    } else {
                        throw {
                            code: -1,
                            data: []
                        };
                    }
                }
            );
        return result;
    }
}