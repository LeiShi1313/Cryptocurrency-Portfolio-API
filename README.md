# Cryptocurrency Portfolio API
Combined some of the bitcoin exchanges RESTful Api

## Supported Exchanges:
- [gate.io](https://gate.io/)
- [okex](https://www.okex.com/)
- [binance](https://www.binance.com)
- [huobi.pro](https://www.huobi.pro/)
- [zb](https://www.zb.com/)

## Build and Run
Install all the dependencies
```
npm install
```
and then run
```
gulp
```
if you wish to track all the `.ts` files and auto-reload. Or
```
npm run build
npm start
```

## Usage
Set all your API keys in `src/keys.json`. Once the serve is up, there are several APIs available:

- Get your balance from `EXCHANGE_NAME`: `/api/v1/balance/{EXCHANGE_NAME}`
- Get exchange rate from `EXCHANGE_NAME` between `COIN_1` to `COIN_2`: `/api/v1/ticker/{EXCHANGE_NAME}/{COIN_1}_{COIN_2}`
- Get exchange rate from all supported exchanges: `/api/v1/ticker/all/{COIN_1}_{COIN_2}`

## Examples

##### Get balance:
```
>> http http://localhost:3000/api/v1/okex/balance
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 400
Content-Type: application/json; charset=utf-8
Date: Tue, 02 Jan 2018 20:36:01 GMT
ETag: W/"190-RFKnf95yC/oMbBX9CYGP3CqHDk8"
X-Powered-By: Express

[
    {
        "amount": "0.00046",
        "status": "free",
        "symbol": "ETH"
    },
    {
        "amount": "0.0001665804",
        "status": "free",
        "symbol": "USDT"
    },
    {
        "amount": "0.00000000388",
        "status": "free",
        "symbol": "BCH"
    }
]
```

##### Get exchange rate from binance
```
>> http http://localhost:3000/api/v1/binance/ticker/btc_usdt
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 30
Content-Type: application/json; charset=utf-8
Date: Tue, 02 Jan 2018 20:39:15 GMT
ETag: W/"1e-o8wnyXppfRu+oNBRroRWk7ZQEe8"
X-Powered-By: Express

{
    "legacy": false,
    "price": 15000
}
```

##### Get all exchange rates
```
>> http http://localhost:3000/api/v1/all/ticker/btc_usdt
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 82
Content-Type: application/json; charset=utf-8
Date: Tue, 02 Jan 2018 20:39:08 GMT
ETag: W/"52-ehjf5hGfbqPVkpXLnRehHiYjkxA"
X-Powered-By: Express

{
    "binance": 15000,
    "gate.io": 14952,
    "huobi": 14997.48,
    "okex": 14979.1601,
    "zb": 16429.98
}
```

