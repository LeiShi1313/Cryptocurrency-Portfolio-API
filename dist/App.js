"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const ExchangeRouter_1 = require("./routes/ExchangeRouter");
class App {
    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
    }
    middleware() {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(cors());
    }
    routes() {
        this.express.use(express.static(path.join(__dirname, '../public')));
        this.express.use('/api/v1/', ExchangeRouter_1.default);
    }
}
exports.default = new App().express;
