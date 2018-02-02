
export interface Exchange {
    getPrice(pair: string): Promise<Data>;
    getBalance(key: string, secret: string): Promise<Data>;
}

export interface Balance {
    symbol: string;
    amount: string | number;
    status: string;
}

export interface Data {
    code: number;
    message?: string;
    data: any;
}

export interface Params {
    [key: string]: string | number;
}

export interface Headers {
    [key: string]: string | number;
}

