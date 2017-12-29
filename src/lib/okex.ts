/**
 * Created by DickyShi on 12/17/17.
 */
import * as axios from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

const API_URL = 'https://www.okex.com/';
const USER_INFO = '/api/v1/userinfo.do';
const TICKER_URL = '/api/v1/ticker.do';


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

function sign(params: object, secret: string): string {
    let formattedParams = formatParam(params);
    formattedParams += '&secret_key=' + secret;
    return crypto.createHash('md5').update(formattedParams).digest('hex').toUpperCase();
}


interface Headers {
    [key: string]: string;
}

let okex = {
    getPrice: function(pair:string, callback: Function) {
        let prams = {
            'symbol': pair
        };
        return axios({
            method: 'GET',
            url: API_URL + TICKER_URL,
            params: prams
        }).then(
            (res: any) => {
                if (res.status === 200) {
                    callback({
                        code: 1,
                        data: res.data['ticker']['last']
                    })
                } else {
                    callback({
                        code: res.data['error_code'],
                        message: '',
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
        let form = {};
        form['api_key'] = key;
        form['sign'] = sign(form, secret);
        let headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };
        console.log(form);
        return axios({
            method: 'POST',
            url: API_URL + USER_INFO,
            headers: headers,
            data: formatParam(form)
        }).then(
            (res: any) => {
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
                callback({
                    code: -1,
                    message: reason,
                    data: []
                });
            });
    }
};


export default okex;
