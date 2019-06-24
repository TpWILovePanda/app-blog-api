/**
 * 引入依賴套件
 */
const cookieParser = require('cookie-parser');
const express = require('express');
const logger = require('morgan');
const path = require('path');
// require('dotenv').config();

/**
 * 主要
 */

const app = express();

/**
 * 使用引入套件
 */

// 日誌紀錄
switch (app.get('env')) {
  case 'development':
    app.use(logger('dev'));
    break;
  case 'production':
    const rfs = require('rotating-file-stream');
    // create a rotating write stream
    const accessLogStream = rfs('access.log', {
      interval: '1d', // rotate daily
      path: path.join(__dirname, 'log')
    });
    app.use(logger('combined', {
      stream: accessLogStream
    }));
    break;
  default:
    app.use(logger('dev'));
    break;
}

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 路由控制
 */

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
app.use('/', indexRouter);
app.use('/api', apiRouter);

/**
 * 暴露接口
 */

module.exports = app;
