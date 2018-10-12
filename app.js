const express = require('express'); // Node.js Web 應用程式架構，大量的 HTTP 公用程式方法與中介軟體可使用
const path = require('path'); // path 模塊提供了一些工具函數，用於處理文件與目錄的路徑
const favicon = require('serve-favicon'); // serve-favicon的中間件，可以用於請求網頁的logo
const logger = require('morgan'); // morgan是express默認的日誌中間件，也可以脫離express，作為node.js的日誌組件單獨使用
const cookieParser = require('cookie-parser'); // 解析 cookie
const bodyParser = require('body-parser'); // 前端表單資料解析 bodyparse並傳到後端伺服器 app.js
const firebase = require('firebase'); // 使用 firebase資料庫
const flash = require('connect-flash'); // 提示使用者及時訊息 ex:您已登入、該欄位已刪除、文章已發表
const session = require('express-session'); // 給會員一個專屬的會員證 session id

// routes 路由設定
const index = require('./routes/index.js'); // 等同於 const index = require('index')，require()函式會自己去找index.js檔案位置
const auth = require('./routes/auth.js');
const dashboard = require('./routes/dashboard.js');
require('dotenv').config(); // 使用dotenv()套件來讀取環境變數

const app = express();

// view engine setup [ XXX.ejs -> ejs engine 解析轉換 ->html ]
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('express-ejs-extend'));
// express-ejs-extend
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

const authChecker = (req, res, next) => {
  console.log('middleware', req.session);
  if (req.session.uid === process.env.ADMIN_UID) {
    return next();
  }
  return res.redirect('/auth/signin');
};

// routes 路由設定
app.use('/', index); // 首頁路由 http://localhost:3000，引入./routes/index.js
app.use('/auth', auth); // 會員路由 http://localhost:3000/auth，引入./routes/auth.js
app.use('/dashboard', authChecker, dashboard); // 部落格路由 http://localhost:3000/dashboard，引入./routes/dashboard.js


// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  res.render('error', {
    title: '您所查看的頁面不存在 :(',
  });
  next();
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  next();
});

module.exports = app;
