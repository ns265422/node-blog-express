const express = require('express');
const moment = require('moment'); // 紀錄發表文章的時間
const striptags = require('striptags'); // 文章太長，節錄一小段並顯示前端頁面
const firebaseDb = require('../connections/firebase_admin_connect');
const convertPagination = require('../modules/pagination'); // 載入分頁小程式
const firebaseSort = require('../modules/firebaseSort'); // 載入文章排序小程式

const router = express.Router();
const categoriesPath = '/categories/';
const categoriesRef = firebaseDb.ref(categoriesPath);
const articlesPath = '/articles/';
const articlesRef = firebaseDb.ref(articlesPath);
const tagsPath = '/tags/';
const tagsRef = firebaseDb.ref(tagsPath);

router.get('/', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard
  const messages = req.flash('error');
  res.render('dashboard/index.ejs', {
    // 載入views/dashboard/index.ejs檔案，並渲染前端頁面
    title: 'Express',
    currentPath: '/',
    hasErrors: messages.length > 0,
  });
});

router.get('/archives/', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/archives
  const messages = req.flash('error');
  const status = req.query.status || 'public'; // 使用分頁標籤控制 "草稿" 及 "公開 public" 文章
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  let categories = {};
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val(); // 取得所有文章
      return articlesRef.orderByChild('update_time').once('value'); // 並依照文章時間做排序
    })
    .then((snapshot) => {
      const sortData = firebaseSort.byDate(snapshot, 'status', status); // 載入文章排序小程式
      const articles = convertPagination(
        sortData,
        currentPage,
        `dashboard/archives?status=${status}`,
      ); // 載入分頁小程式
      res.render('dashboard/archives.ejs', {
        // 載入views/dashboard/archives.ejs檔案，並渲染前端頁面
        title: 'Express',
        articles: articles.data,
        pagination: articles.page,
        currentPath: '/archives/',
        messages,
        categories,
        status,
        moment, // 紀錄發表文章的時間

        // 文章太長，節錄前 150字並顯示前端頁面，剩下的字以...顯示
        // <%- striptags(articles[prop].content).slice(0, 150) %>...
        striptags,
        hasErrors: messages.length > 0,
      });
    });
});

// 讀取 新增文章 撈後端伺服器資料庫 -> 渲染更新到前端
router.get('/article/create', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/article/create
  const messages = req.flash('error');
  categoriesRef.once('value').then((snapshot) => {
    const categories = snapshot.val();
    res.render('dashboard/article.ejs', {
      // 載入views/dashboard/article.ejs檔案，並渲染前端頁面
      title: 'Express',
      currentPath: '/article/create',
      categories,
      messages,
      hasErrors: messages.length > 0,
    });
  });
});

router.get('/article/:id', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/article/:id
  const messages = req.flash('error');
  const id = req.param('id');
  let categories = {};
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val();
      return articlesRef.child(id).once('value'); // 取得最新文章的id之後，撈該id裡面的資料
    })
    .then((snapshot) => {
      const article = snapshot.val();
      res.render('dashboard/article.ejs', {
        // 載入views/dashboard/article.ejs檔案，並渲染前端頁面
        title: 'Express',
        currentPath: '/article/',
        article,
        messages,
        categories,
        hasErrors: messages.length > 0,
      });
    });
});

// 新增或刪除  後台文章分類欄位
// 去 firebase的 categories 資料夾，拿資料並呈現在前端
// 後端資料庫 -> 前端
router.get('/categories', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/categories
  const messages = req.flash('error');
  categoriesRef.once('value').then((snapshot) => {
    const categories = snapshot.val(); // 拿到 firebase/categories裡面的資料
    res.render('dashboard/categories.ejs', {
      // 載入views/dashboard/categories.ejs檔案，並渲染前端頁面
      title: 'Express',
      currentPath: '/categories/',
      categories,
      messages,
      hasErrors: messages.length > 0,
    });
  });
});

router.get('/tags', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/tags
  res.render('dashboard/tags.ejs', {
    // 載入views/dashboard/tags.ejs檔案，並渲染前端頁面
    title: 'Express',
  });
});

// === 文章管理 ===
// Post 發表文章  前端 (帶資料 ) -> 存到後端資料庫
router.post('/article/create', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/article/create
  const articleRef = articlesRef.push();
  const key = articleRef.key;
  const updateTime = Math.floor(Date.now() / 1000);
  const data = req.body;
  data.id = key;
  data.update_time = updateTime;
  articleRef.set(data).then(() => {
    // 把資料寫到資料庫
    res.redirect('/dashboard/archives'); // 完成之後，轉址 http://localhost:3000/dashboard/archives
  });
});
// 更新文章  前端 -> 存到後端資料庫
router.post('/article/update/:id', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/article/update/:id
  const data = req.body;
  const id = req.param('id');
  articlesRef
    .child(id)
    .update(data)
    .then(() => {
      res.redirect(`/dashboard/article/${data.id}`);
    });
});

// 刪除文章
router.delete('/article/:id', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/article/:id
  const id = req.param('id');
  articlesRef
    .child(id)
    .remove()
    .then(() => {
      res.send({
        success: true,
        url: '/dashboard/archives/public',
      });
      res.end();
    });
});

// === 標籤管理 ===
// Post
router.post('/api/tag/create', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/api/tag/create
  const tagRef = tagsRef.push();
  // const key = tagRef.key;
  const data = req.body;
  tagsRef
    .orderByChild('name')
    .equalTo(data.name)
    .once('value')
    .then((snapshot) => {
      if (snapshot.val() !== null) {
        res.send({
          success: false,
          message: '已有相同的值',
        });
        res.end();
      } else {
        // 如果沒有這個值，才能技術儲存
        tagRef.set(data).then((response) => {
          res.send({
            success: true,
            data: response,
          });
          res.end();
        });
      }
    });
});

router.get('/api/tags', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/api/tags
  tagsRef.once('value').then((snapshot) => {
    const tags = snapshot.val();
    res.send({
      success: true,
      data: tags,
    });
    res.end();
  });
});

// === 文章分類欄位  新增和刪除 ===

// Post 接收前端表單傳過來給後端伺服器的資料  前端 (分類 data)->後端處理 -> 寫進 firebase
// Create新增-文章分類與路徑欄位
router.post('/categories/create', (req, res) => {
  // 在這個路徑 http://localhost:3000/dashboard/categories/create
  const categoryRef = categoriesRef.push(); // firebse的categories資料夾，push主要是取得路徑，可以用來作為資料的 id
  const key = categoryRef.key; // categories資料夾裡面的categorie.key
  const data = req.body;
  data.id = key; // firebase orderBy 的方法一次只能比對一個
  categoriesRef
    .orderByChild('path')
    .equalTo(data.path)
    .once('value') // 去firebase的path欄位，比對是否有相同的值
    .then((snapshot) => {
      if (snapshot.val() !== null) {
        // 不是空值，代表有相同的值(相同路徑)
        req.flash('error', '已有相同的路徑'); // 發生錯誤(建立相同類別或路徑)
        res.redirect('/dashboard/categories'); // 轉址到 http://localhost:3000/dashboard/categories
      } else {
        // 如果沒有這個值，才能儲存
        categoryRef.set(data).then(() => {
          // 前端 (分類 data)->後端處理 -> 寫進 firebase
          res.redirect('/dashboard/categories'); // 存完之後，轉址到 http://localhost:3000/dashboard/categories
        });
      }
    });
});

// Post 接收前端表單傳過來給後端伺服器的資料  前端 (分類 data)->後端處理 -> 寫進 firebase
// Delete  刪除-文章分類與路徑欄位
// 在這個路徑 http://localhost:3000/dashboard/categories/delete/:id
router.post('/categories/delete/:id', (req, res) => {
  const id = req.param('id'); // 取得要刪除的分類欄位
  categoriesRef.child(id).remove(); // 刪除該分類欄位
  req.flash('error', '欄位已經被刪除'); // 提示使用者該分類欄位已刪除的訊息
  res.redirect('/dashboard/categories'); // 存完之後，轉址到 http://localhost:3000/dashboard/categories
  res.end();
});

module.exports = router;
