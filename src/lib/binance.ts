import axios, { AxiosResponse } from "axios";
import * as crypto from "crypto";
import * as querystring from "querystring";

import { Exchange, Data, Balance, Params} from "./exchange";


export class Binance implements Exchange {
    private API_URL = 'https://api.binance.com';
    private USER_DATA = '/api/v3/account';
    private PRICE = '/api/v3/ticker/price';

    private sign(params: string, secret: string) {
        return crypto.createHmac('sha256', secret).update(params).digest('hex').toString();
    }

    public getPrice(pair: string): Promise<Data> {
        let pairs = pair.split('_');
        let params: Params = {
            'symbol': pairs.map(p => p.toUpperCase()).join("")
        };
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        const result = axios({
            method: 'GET',
            url: this.API_URL + this.PRICE,
            headers: headers,
            params: params
        }).then(
            (res: AxiosResponse) => {
                console.log(res.data);
                if (res.status === 200) {
                    return {
                        code: 1,
                        data: res.data['price']
                    };
                } else {
                    throw {
                        code: res.data['code'],
                        message: res.data['msg'],
                        data: []
                    };
                }
            }
        ).catch(
            (reason: any) => {
                if (reason['code']) {
                    throw reason;
                } else {
                    const data = reason.response.data;
                    if (data) {
                        throw {
                            code: data.code,
                            message: data.msg,
                            data: []
                        };
                    } else {
                        throw {
                            code: -1,
                            data: []
                        }
                    }
                }
            }
        );
        return result;
    }
    getBalance(key: string, secret: string): Promise<Data> {
        let headers = {
            'X-MBX-APIKEY': key,
            'Content-type': 'application/x-www-form-urlencoded'
        };
        let params: Params = {
            timestamp: new Date().getTime()
        };
        params['signature'] = this.sign(querystring.stringify(params), secret);
        const result = axios({
            method: 'GET',
            url: this.API_URL + this.USER_DATA,
            headers: headers,
            params: params
        }).then(
            (res: AxiosResponse) => {
                if (res.status === 200) {
                    let data: Balance[] = [];
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
                    return {
                        code: 1,
                        data: data
                    };
                } else {
                    throw {
                        code: res.data['code'],
                        message: res.data['msg'],
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

