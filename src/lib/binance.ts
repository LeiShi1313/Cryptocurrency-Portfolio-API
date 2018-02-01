import axios, { AxiosResponse } from "axios";
import * as crypto from "crypto";
import * as querystring from "querystring";

import { Exchange, Params} from "./exchange";


export class Binance implements Exchange {
    private API_URL = 'https://api.binance.com';
    private USER_DATA = '/api/v3/account';
    private PRICE = '/api/v3/ticker/price';

    private sign(params: string, secret: string) {
        return crypto.createHmac('sha256', secret).update(params).digest('hex').toString();
    }

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
            url: this.API_URL + this.PRICE,
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
        params['signature'] = this.sign(querystring.stringify(params), secret);
        axios({
            method: 'GET',
            url: this.API_URL + this.USER_DATA,
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

