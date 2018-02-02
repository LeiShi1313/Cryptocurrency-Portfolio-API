import axios, { AxiosResponse, AxiosRequestConfig} from "axios";
import * as crypto from 'crypto';
import * as querystring from 'querystring';

import { Exchange, Balance, Data, Params, Headers } from './exchange';


export class ZB implements Exchange {
    private API_URL = 'https://trade.zb.com/';
    private ACCOUNT_INFO = 'api/getAccountInfo';
    private MARKET_URL = 'http://api.zb.com/';
    private TICKER_URL = 'data/v1/ticker';

    private sorted(o: any) {
        let p = Object.create(null);
        for (const k of Object.keys(o).sort()) p[k] = o[k];
        return p;
    }

    private sign(params: Params, secret: string): string {
        let sortedParams = querystring.stringify(this.sorted(params));
        let sha1SecretKey = crypto.createHash('sha1').update(secret).digest('hex');
        return crypto.createHmac('md5', sha1SecretKey).update(sortedParams).digest('hex');
    }

    public getPrice(pair:string): Promise<Data> {
        let prams: Params = {
            'market': pair
        };
        const result = axios({
            method: 'GET',
            url: this.MARKET_URL + this.TICKER_URL,
            params: prams
        }).then(
            (res: AxiosResponse) => {
                if (!res.data['error']) {
                    return {
                        code: 1,
                        data: res.data['ticker']['last']
                    }
                } else {
                    throw {
                        code: -1,
                        message: res.data['error'],
                        data: ''
                    }
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
        )
        return result;
    }
    public getBalance(key: string, secret: string) {
        let params: Params = {
            'accesskey': key,
            'method': 'getAccountInfo'
        };
        let headers: Headers = {};
        params['sign'] = this.sign(params, secret);
        params['reqTime'] = new Date().getTime();
        const result = axios({
            method: 'GET',
            url: this.API_URL + this.ACCOUNT_INFO,
            headers: headers,
            params: params
        }).then(
            (res:AxiosResponse) => {
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
                    return {
                        code: 1,
                        data: data
                    };
                } else {
                    throw {
                        code: res.data['code'],
                        message: res.data['message'],
                        data: []
                    };
                }
            }).catch(
                (reason: any) => {
                    if (reason['code']) {
                        throw reason;
                    } else {
                        throw {
                            code: -1,
                            data: []
                        };
                    }
                });
            return result;
    }

}

