const express = require('express');
const router = express.Router();

/* === 插件 === */
// const striptags = require('striptags');
// const moment = require('moment');

/* === 模組 === */
// 分頁計算模組
const convertPagination = require('../modules/convertPagination');

/* == 資料庫 == */
const db = require('../connections/firebase_admin');
const firebase = require('../connections/firebase_client');
const categoriesRef = db.ref('/blog/categories/');
const articlesRef = db.ref('/blog/articles/');
const usersRef = db.ref('/blog/users');

/* API Home */
router.get('/', (req, res) => {
  const anyRef = db.ref('any');
  anyRef.once('value', (snapshot) => {
    res.send(`Welcome API ${snapshot.val()}`);
  });
});

/* === 文章 === */
// [免驗證]取得文章列表
router.get('/articles', (req, res) => {
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
        .orderByChild('updateTime')
        .once('value');
    })
    .then((snapshot) => {
      try {
        snapshot.forEach((snapshotChild) => {
          const child = snapshotChild.val();
          if ('public' === child.status) articles.push(child);
        });
        articles.reverse();
        return Promise.resolve('Success');
      } catch {
        return Promise.resolve({
          code: '403',
          message: '取得文章列表[0]'
        });
      }
    })
    .then(() => {
      try {
        // 分頁處理 - Start
        const val = convertPagination(articles, currentPage);
        data = val.data;
        page = val.page;
        return Promise.resolve('Success');
        // 分頁處理 - End
      } catch {
        return Promise.resolve({
          code: '403',
          message: '取得文章列表[1]'
        });
      }
    })
    .then(() => {
      try {
        // 資料 - 回傳優化
        data = data.map((item) => {
          const val = {
            content: item.content,
            title: item.title,
            updateTime: item.updateTime,
            categoryName: categories[item.category].name,
          };
          // 排序 - 照字母排序
          return Object.keys(val).sort().reduce((b, c) => (b[c] = val[c], b), {});
        })
        return Promise.resolve('Success');
      } catch {
        return Promise.resolve({
          code: '403',
          message: '取得文章列表[2]'
        });
      }
    })
    .then(() => {
      res.send({
        success: true,
        message: '取得文章列表成功',
        content: { articles: data, page }
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '取得文章列表失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [免驗證]取得文章分類
router.get('/article/categories', (req, res) => {
  let categories = {};
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val();
      res.send({
        success: true,
        message: '取得文章分類成功',
        content: { categories }
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '取得文章分類失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [免驗證]取得文章內容
router.get('/article/:id', (req, res) => {
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
        return Promise.reject({
          code: '403',
          message: '您尋找的文章不存在[0]'
        });
      } else {
        res.send({
          success: true,
          message: '取得文章內容成功',
          content: { article, categories }
        });
      }
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '取得文章內容失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [需驗證][後台]取得文章列表
router.get('/admin/archives', (req, res) => {
  if (!req.session.uid) {
    res.send({
      success: false,
      message: '請先登入帳號',
      content: {}
    });
  };

  let articles = [];
  let categories = {};
  let currentPage = Number.parseInt(req.query.page) || 1; // 當前頁數
  let data = [];
  let page = {};
  let status = req.query.status || 'public';
  if (status !== 'pubic' && status !== 'draft') status === 'pubic';
  categoriesRef
    .once('value')
    .then((snapshot) => {
      categories = snapshot.val();
      return articlesRef
        .orderByChild('updateTime')
        .once('value');
    })
    .then((snapshot) => {
      try {
        snapshot.forEach((snapshotChild) => {
          const child = snapshotChild.val();
          if (status === child.status) articles.push(child);
        });
        articles.reverse();
        return Promise.resolve('Success');
      } catch {
        return Promise.reject({
          code: '403',
          message: '取得文章列表[0]'
        });
      }
    })
    .then(() => {
      try {
        // 分頁處理 - Start
        const val = convertPagination(articles, currentPage);
        data = val.data;
        page = val.page;
        return Promise.resolve('Success');
        // 分頁處理 - End
      } catch {
        return Promise.reject({
          code: '403',
          message: '取得文章列表[1]'
        });
      }
    })
    .then(() => {
      res.send({
        success: true,
        message: '取得文章列表',
        content: {
          articles: data,
          categories,
          page,
          status
        }
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '取得文章列表失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [需驗證][後台]取得文章內容
router.get('/admin/article/:id', (req, res) => {
  if (!req.session.uid) {
    res.send({
      success: false,
      message: '請先登入帳號',
      content: {}
    });
  };

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
      res.send({
        success: true,
        message: '取得文章成功',
        content: {
          article,
          categories,
          id
        }
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '取得文章失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [需驗證][後台]新增文章
router.post('/admin/article/create', (req, res) => {
  if (!req.session.uid) {
    res.send({
      success: false,
      message: '請先登入帳號',
      content: {}
    });
  };

  const data = req.body;
  const articleRef = articlesRef.push();
  const key = articleRef.key;
  const updateTime = Math.floor(Date.now() / 1000);
  data.id = key;
  data.updateTime = updateTime;
  articleRef
    .set(data)
    .then(() => {
      res.send({
        success: true,
        message: '新增文章成功',
        content: { id: data.id }
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '新增文章失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

/* [需驗證][後台]更新文章 */
router.post('/admin/article/update/:id', (req, res) => {
  const data = req.body;
  const id = req.params.id;
  articlesRef
    .child(id)
    .update(data)
    .then(() => {
      res.send({
        success: true,
        message: '更新文章成功',
        content: {}
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '更新文章失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [需驗證][後台]刪除文章
router.post('/article/delete/:id', (req, res) => {
  const id = req.params.id;
  // 此需要調整! 文章不該真的被刪除, 而是應該移置刪除區域
  articlesRef
    .child(id)
    .remove()
    .then(() => {
      res.send({
        success: true,
        message: '文章刪除成功',
        content: {}
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '文章刪除失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [需驗證][後台]新增文章分類
router.post('/categories/create', (req, res) => {
  const data = req.body;
  const categoryRef = categoriesRef.push();
  const key = categoryRef.key;
  data.id = key;
  categoriesRef
    .orderByChild('name')
    .equalTo(data.name)
    .once('value')
    .then((snapshot) => {
      if (snapshot.val() !== null)
        return Promise.reject({
          code: '403',
          message: '已有相同分類名稱'
        });
      else return Promise.resolve('Success');
    })
    .then(() => {
      return categoriesRef
        .orderByChild('path')
        .equalTo(data.path)
        .once('value');
    })
    .then((snapshot) => {
      if (snapshot.val() !== null)
        return Promise.reject({
          code: '403',
          message: '已有相同路徑'
        });
      else return Promise.resolve('Success');
    })
    .then(() => {
      return categoryRef.set(data);
    })
    .then(() => {
      res.send({
        success: true,
        message: '新增文章分類成功',
        content: {}
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '新增文章分類失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

// [需驗證][後台]刪除文章分類
router.post('/categories/delete/:id', (req, res) => {
  const id = req.params.id;
  // 此需要調整! 文章不該真的被刪除, 而是應該移置刪除區域
  categoriesRef
    .child(id)
    .remove()
    .then(() => {
      res.send({
        success: false,
        message: '刪除文章分類成功',
        content: {}
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      res.send({
        success: false,
        message: '刪除文章分類失敗',
        content: {
          errorCode,
          errorMessage
        }
      });
    });
});

/* === 會員 === */
/* [免驗證]取得會員資訊 */
router.get('/user/:accountName/info', (req, res) => {
  const accountName = req.params.accountName;
  const userRef = usersRef.child(accountName);

  userRef
    .once('value')
    .then((snapshot) => {
      const user = snapshot.val();
      if (!user) {
        return Promise.reject({
          code: '403',
          message: '使用者不存在'
        });
      } else {
        res.send({
          success: true,
          message: '取得會員資訊成功',
          content: {
            about: user.about,
            accountName,
            email: user.email,
            job: user.job,
            nickname: user.nickname,
            picture: user.picture
          }
        });
      }
    })
    .catch((error) => {
      res.send({
        success: false,
        message: error,
        content: {}
      });
    });
});

// 會員登入 - 帳號/密碼
router.post('/sign-in', (req, res) => {
  const data = req.body;
  const email = data.email;
  const password = data.password;
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((response) => {
      const uid = response.user.uid;
      req.session.uid = uid;
      res.send({
        success: true,
        message: '登入成功',
        content: { uid }
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      let message = '';
      if (errorCode === 'auth/wrong-password') message = '密碼錯誤';
      else message = '登入失敗';
      res.send({
        success: false,
        message,
        content: { errorCode, errorMessage }
      });
    });
});

// 會員登出
router.get('/sign-out', (req, res) => {
  req.session.uid = '';
  res.send({
    success: true,
    message: '登出成功',
    content: {}
  });
});

// 會員註冊
router.post('/sign-up', (req, res) => {
  const data = req.body;
  const accountName = data.accountName;
  const email = data.email;
  const password = data.password;
  const nickname = data.nickname;
  const dafaultUserData = {
    about: '',
    accountName: '',
    email: '',
    job: '',
    nickname: '',
    picture: '',
    uid: ''
  };
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((response) => {
      const uid = response.user.uid;
      const userRef = db.ref(`/blog/users/${accountName}`);
      const reqUserData = {
        accountName,
        email,
        nickname,
        uid
      };
      const userData = { ...dafaultUserData, ...reqUserData };
      return userRef.set(userData);
    })
    .then(() => {
      res.send({
        success: true,
        message: '註冊成功',
        content: {}
      });
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      let message = '';
      if (errorCode == 'auth/weak-password') message = 'The password is too weak.';
      else message = '註冊失敗';
      res.send({
        success: false,
        message,
        content: { errorCode, errorMessage }
      });
    });
});

/* 取的 - 登入狀態 */
// 檢查用戶是否仍持續登入
router.get('/sign-check', (req, res) => {
  if (req.session.uid) {
    res.send({
      success: true,
      message: '已登入帳號',
      content: {}
    });
  } else {
    res.send({
      success: false,
      message: '未登入帳號',
      content: {}
    });
  }
});

module.exports = router;
