import axios, { AxiosResponse, AxiosRequestConfig} from "axios";
import * as crypto from 'crypto';
import * as querystring from 'querystring';

import { Exchange, Params, Headers } from './exchange';



export class Huobi implements Exchange {
    private METHOD = 'https://';
    private API_URL = 'api.huobi.pro';
    private BALANCE_URL = '/v1/account/accounts/587976/balance';
    private MARKET_DETAIL = '/market/detail/merged';

    private sorted(o: any) {
        let p = Object.create(null);
        for (const k of Object.keys(o).sort()) p[k] = o[k];
        return p;
    }

    private sign(method: string, api_url: string, method_url: string,
                  params: any, secret: string): string {
        let formattedParams = querystring.stringify(this.sorted(params));
        let totalParams: string = method + '\n' + api_url + '\n' + method_url + '\n' + formattedParams;
        console.log(totalParams);
        let sha256String = crypto.createHmac('sha256', secret).update(totalParams).digest();
        console.log(sha256String);
        return new Buffer(sha256String).toString('base64');
    }

    public getPrice(pair: string, callback: Function) {
        let pairs = pair.split('_');
        let params:Params = {
            'symbol': pairs.map(p => p.toLowerCase()).join("")
        };
        let headers: Headers = {
            'Content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        };

        axios({
            method: 'GET',
            url: this.METHOD + this.API_URL + this.MARKET_DETAIL,
            headers: headers,
            params: params
        }).then(
            (res: AxiosResponse) => {
                if (res.data['status'] === 'ok') {
                    callback({
                        code: 1,
                        data: res.data['tick']['close']
                    })
                } else {
                    callback({
                        code: res.data['err-code'],
                        message: res.data['err-msg'],
                        data: ''
                    })
                }

            }
        ).catch(
            (reason: any) => {
                callback({
                    code: -1,
                    data: ''
                })
            }
        )
    }
    public getBalance(key: string, secret: string, callback: Function) {
        let params: Params = {
            'SignatureMethod': 'HmacSHA256',
            'SignatureVersion': '2',
            'AccessKeyId': key,
            'Timestamp': new Date().toISOString().split('.')[0],
        };
        let headers: Headers = {
            'Content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        };
        params['Signature'] = this.sign('GET', this.API_URL, this.BALANCE_URL, params, secret);
        axios({
            method: 'GET',
            url: this.METHOD + this.API_URL + this.BALANCE_URL,
            headers: headers,
            params: params
        }).then(
            (res: AxiosResponse) => {
                console.log(res.data);
                if (res.data['status'] === 'ok') {
                    let data = [];
                    let list = res.data['data']['list'];
                    for (let asset of list) {
                        if (asset['balance'] != 0.0) {
                            data.push({
                                symbol: asset['currency'].toUpperCase(),
                                amount: asset['balance'],
                                status: asset['type']
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
                        message: res.data['error_code'],
                        data: []
                    })
                }
            }
        ).catch(
            (reason: any) => {
                console.log(reason);
                callback({
                    code: -1,
                    message: reason,
                    data: []
                });
            });
    }
}


