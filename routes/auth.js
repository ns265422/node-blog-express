const express = require('express');
const firebaseClient = require('../connections/firebase_connect');

const router = express.Router();

router.get('/signup', (req, res) => { // 在這個路徑 http://localhost:3000/auth/signup
  const messages = req.flash('error');
  res.render('dashboard/signup.ejs', { // 讀入./dashboard/signup.ejs畫面
    messages,
    hasErrors: messages.length > 0,
  });
});

router.get('/signin', (req, res) => { // 在這個路徑 http://localhost:3000/auth/signin
  const messages = req.flash('error');
  res.render('dashboard/signin.ejs', { // 讀入./dashboard/signin.ejs畫面
    messages,
    hasErrors: messages.length > 0,
  });
});

router.get('/signout', (req, res) => { // 在這個路徑 http://localhost:3000/auth/signout
  req.session.uid = ''; // 登出之後，把 id清空
  res.redirect('/auth/signin'); // 轉址到 http://localhost:3000/auth/signin
});

router.post('/signup', (req, res) => { // 在這個路徑 http://localhost:3000/auth/signup
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirm_password;
  if (password !== confirmPassword) {
    req.flash('error', '兩個密碼輸入不符合'); // 告知使用者登入密碼錯誤訊息
    res.redirect('/auth/signup'); // 轉址到 http://localhost:3000/auth/signup
  }

  firebaseClient.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      console.log(req.session.uid);
      res.redirect('/auth/signin'); // 登入成功，轉址到 http://localhost:3000/auth/signin
    })
    .catch((error) => {
      console.log(error);
      req.flash('error', error.message); // 告知使用者登入失敗訊息
      res.redirect('/auth/signup'); // 登入失敗，轉址到 http://localhost:3000/auth/signup
    });
});

router.post('/signin', (req, res) => { // 在這個路徑 http://localhost:3000/auth/signin
  const email = req.body.email;
  const password = req.body.password;

  firebaseClient.auth().signInWithEmailAndPassword(email, password)
    .then((user) => {
      req.session.uid = user.uid;
      req.session.mail = req.body.email;
      console.log(req.session.uid);
      res.redirect('/dashboard'); // 轉址到 http://localhost:3000/dashboard
    })
    .catch((error) => {
      console.log(error);
      req.flash('error', error.message);
      res.redirect('/auth/signin'); // 轉址到 http://localhost:3000/auth/signin
    });
});

module.exports = router;
