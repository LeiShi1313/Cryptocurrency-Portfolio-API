import * as axios from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

const METHOD = 'https://';
const API_URL = 'api.huobi.pro';
const BALANCE_URL = '/v1/account/accounts/587976/balance';
const MARKET_DETAIL = '/market/detail/merged';

function sorted(o: any) {
    let p = Object.create(null);
    for (const k of Object.keys(o).sort()) p[k] = o[k];
    return p;
}

function sign(method: string, api_url: string, method_url: string,
              params: any, secret: string): string {
    let formattedParams = querystring.stringify(sorted(params));
    let totalParams: string = method + '\n' + api_url + '\n' + method_url + '\n' + formattedParams;
    console.log(totalParams);
    let sha256String = crypto.createHmac('sha256', secret).update(totalParams).digest();
    console.log(sha256String);
    return new Buffer(sha256String).toString('base64');
}


let huobi = {
    getPrice: function(pair: string, callback: Function) {
        let pairs = pair.split('_');
        let params = {
            'symbol': pairs.map(p => p.toLowerCase()).join("")
        };
        let headers = {
            'Content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        };
        return axios({
            method: 'GET',
            url: METHOD + API_URL + MARKET_DETAIL,
            headers: headers,
            params: params
        }).then(
            (res: any) => {
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
            'SignatureMethod': 'HmacSHA256',
            'SignatureVersion': '2',
            'AccessKeyId': key,
            'Timestamp': new Date().toISOString().split('.')[0],
        };
        let headers = {
            'Content-type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
        };
        params['Signature'] = sign('GET', API_URL, BALANCE_URL, params, secret);
        return axios({
            method: 'GET',
            url: METHOD + API_URL + BALANCE_URL,
            headers: headers,
            params: params
        }).then(
            (res: any) => {
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
};


export default huobi;

