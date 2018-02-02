import axios, { AxiosResponse, AxiosRequestConfig} from "axios";
import * as crypto from 'crypto';
import * as querystring from 'querystring';

import { Exchange, Data, Balance, Params, Headers } from './exchange';


export class OKex implements Exchange {
    private API_URL = 'https://www.okex.com/';
    private USER_INFO = '/api/v1/userinfo.do';
    private TICKER_URL = '/api/v1/ticker.do';

    private sorted(o: any) {
        let p = Object.create(null);
        for (const k of Object.keys(o).sort()) p[k] = o[k];
        return p;
    }

    private sign(params: object, secret: string): string {
        let formattedParams = querystring.stringify(this.sorted(params));
        formattedParams += '&secret_key=' + secret;
        return crypto.createHash('md5').update(formattedParams).digest('hex').toUpperCase();
    }

    public getPrice(pair:string): Promise<Data> {
        let prams: Params = {
            'symbol': pair
        };
        const result = axios({
            method: 'GET',
            url: this.API_URL + this.TICKER_URL,
            params: prams
        }).then(
            (res: AxiosResponse) => {
                if (res.status === 200) {
                    return {
                        code: 1,
                        data: res.data['ticker']['last']
                    }
                } else {
                    throw {
                        code: res.data['error_code'],
                        message: '',
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

    public getBalance(key: string, secret: string): Promise<Data> {
        let form: Params = {};
        form['api_key'] = key;
        form['sign'] = this.sign(form, secret);
        let headers: Headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        const result = axios({
            method: 'POST',
            url: this.API_URL + this.USER_INFO,
            headers: headers,
            data: querystring.stringify(form)
        } as AxiosRequestConfig).then(
            (res: AxiosResponse) => {
                if (res.data['result'] === true) {
                    let data = [];
                    let funds = res.data['info']['funds'];
                    for (let status of ['free', 'freezed']) {
                        if (funds[status]) {
                            for (let [symbol, amount] of Object.entries(funds[status])) {
                                if (amount != 0 && symbol != 'bcc') {
                                    data.push({
                                        symbol: symbol.toUpperCase(),
                                        amount: amount,
                                        status: status
                                    });
                                }
                            }
                        }
                    }
                    return {
                        code: 1,
                        data: data
                    };
                } else {
                    throw {
                        code: res.data['code'],
                        message: res.data['error_code'],
                        data: []
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
            });
        return result;
    }
}

