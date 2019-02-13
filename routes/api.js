const express = require('express');
const router = express.Router();

/* 資料庫 */
const db = require('../connections/firebase_admin');
const categoriesRef = db.ref('/blog/categories/');
const articlesRef = db.ref('/blog/articles/');
const usersRef = db.ref(`/blog/users`);

/* 模組 */
// 分頁計算模組
const convertPagination = require('../modules/convertPagination');

/* API Home */
router.get('/', (req, res, next) => {
  const anyRef = db.ref('any');
  anyRef.once('value', (snapshot) => {
    res.send(`Welcome API ${snapshot.val()}`);
  });
});

/* === 文章 === */
// 取得文章列表 - 公開
router.get('/articles', (req, res, next) => {
  let articles = [];
  let categories = {};
  let currentPage = Number.parseInt(req.query.page) || 1; // 當前頁數
  let data = [];
  let page = {};
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val();
      return articlesRef
        .orderByChild('update_time')
        .once('value');
    })
    .then((snapshot) => {
      snapshot.forEach((snapshotChild) => {
        const child = snapshotChild.val();
        if ('public' === child.status) {
          articles.push(child);
        }
      });
      articles.reverse();
      return Promise.resolve('Success');
    })
    .then(() => {
      // 分頁處理 - Start
      const val = convertPagination(articles, currentPage);
      data = val.data;
      page = val.page;
      return Promise.resolve('Success');
      // 分頁處理 - End
    })
    .then(() => {
      res.send({
        success: true,
        content: {
          articles: data,
          categories,
          page,
        },
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        content: { error },
      });
    });
});

// 取得文章分類
router.get('/article/categories', (req, res, next) => {
  let categories = {};
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val();
      return Promise.resolve('Success');
    })
    .then(() => {
      res.send({
        success: true,
        content: {
          categories,
        },
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        content: { error },
      });
    });
});

// 取得文章內容
router.get('/article/:id', (req, res, next) => {
  const id = req.params.id;
  let categories = {};
  let article = {};
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val();
      return articlesRef
        .child(id)
        .once('value');
    })
    .then((snapshot) => {
      article = snapshot.val();
      if (!article) {
        return Promise.reject('您尋找的文章不存在');
      } else {
        res.send({
          success: true,
          content: {
            article,
            categories,
          },
        });
      }
    })
    .catch((error) => {
      res.send({
        success: false,
        content: { error },
      });
    });
});

/* === 會員 === */
/* 取得會員資訊 - 公開 */
router.get('/user/:account_name/info', (req, res, next) => {
  const accountName = req.params.account_name;
  const userRef = usersRef.child(accountName);

  userRef
    .once('value')
    .then((snapshot) => {
      const user = snapshot.val();
      if (!user) {
        return Promise.reject('使用者不存在');
      } else {
        res.send({
          success: true,
          content: {
            about: user.about,
            accountName,
            email: user.email,
            job: user.job,
            nickname: user.nickname,
          },
        });
      }
    })
    .catch((error) => {
      res.send({
        success: false,
        content: { error },
      });
    });
});

module.exports = router;
