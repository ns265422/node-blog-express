// 前端路由，後端伺服器(傳資料) ->前端瀏覽器( get 渲染更新畫面 )

const express = require('express');
const moment = require('moment'); // 取得文章發表時間
const striptags = require('striptags'); // 文章太長，節錄部分文字顯示在前端
const firebaseDb = require('../connections/firebase_admin_connect');
const convertPagination = require('../modules/pagination'); // 載入分頁小程式
const firebaseSort = require('../modules/firebaseSort'); // 載入文章排序小程式
const errorPage = require('../modules/errorPage'); // 載入錯誤頁面小程式

const router = express.Router();
const categoriesPath = '/categories/';
const categoriesRef = firebaseDb.ref(categoriesPath);
const articlesPath = '/articles/';
const articlesRef = firebaseDb.ref(articlesPath);

/* GET home page. */

/*  分頁製作
    總共有幾頁 pageTotal
    目前在第幾頁 currentPage
    每頁有多少文章 perpage
    當前頁面資料
*/

// 前台 - 文章首頁
router.get('/', (req, res) => { //  在這個頁面 http://http://localhost:3000/
  const currentPage = Number.parseInt(req.query.page, 10) || 1; // 每頁顯示10篇文章
  let categories = {};

  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  }).then((snapshot) => {
    const sortData = firebaseSort.byDate(snapshot, 'status', 'public');
    const articles = convertPagination(sortData, currentPage);
    res.render('archives.ejs', { // 載入./views/archives.ejs檔案，並渲染前端頁面
      title: 'Express',
      categoryId: null,
      articles: articles.data,
      pagination: articles.page,
      categories,
      striptags, // 去除 HTML 標籤套件
      moment, // 時間套件
    });
  });
});

// 前台 - 文章分類欄位
router.get('/archives/:category', (req, res) => { // 目前在這個頁面 http://localhost:3000/archives/:category
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  const categoryPath = req.param('category');
  let categories = {};
  let categoryId = '';
  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.val().path === categoryPath) {
        categoryId = childSnapshot.val().id;
      }
    });
    return articlesRef.orderByChild('update_time').once('value');
  }).then((snapshot) => {
    const sortData = firebaseSort.byDate(snapshot, 'category', categoryId);
    const articles = convertPagination(sortData, currentPage, `archives/${categoryPath}`);
    res.render('archives', {
      title: 'Express',
      categories,
      categoryId,
      articles: articles.data,
      pagination: articles.page,
      striptags, // 去除 HTML 標籤套件
      moment, // 時間套件
    });
  });
});

// 前台 -目前正在看的文章
router.get('/post/:id', (req, res) => { // 目前在這個頁面 http://localhost:3000/post/:id
  const id = req.param('id');
  let categories = {};
  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
  }).then((snapshot) => {
    console.log(snapshot.val());
    const article = snapshot.val();
    if (!article) {
      return errorPage(res, '找不到該文章');
    }
    res.render('post.ejs', { // 載入./views/post.ejs檔案，並渲染前端頁面
      title: 'Express',
      categoryId: null,
      article,
      categories,
      moment, // 時間套件
    });
  });
});

module.exports = router;
