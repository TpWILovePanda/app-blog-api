var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET Fail */
router.get('/fail', (req, res) => {
  throw new Error('Nope!');
});

/* GET Epic Fail */
router.get('/epic-fail', (req, res) => {
  process.nextTick(() => {
    throw new Error('Kaboom!');
  });
});

module.exports = router;
