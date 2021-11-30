var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/fireBaseTest',function(req, res, next) {
  console.log("데이터 삽입");
  res.render('fireBaseTest.ejs');
});


module.exports = router;
