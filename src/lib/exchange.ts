/**
 * Created by DickyShi on 12/17/17.
 */

export interface Exchange {
    getPrice(pair: string, callback: Function): void;
    getBalance(key: string, secret: string, callback: Function): void;
}


export interface Params {
    [key: string]: string | number;
}

export interface Headers {
    [key: string]: string | number;
}

