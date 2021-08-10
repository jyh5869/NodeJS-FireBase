var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var dateFormat = require('dateformat');
 
router.get('/',function(req, res, next) {
    res.redirect('boardList');
});
 
var config = {
    apiKey: "AIzaSyD_tg-m8Y77Q7K_w2lyY68igE4RWy-63DY",
    authDomain: "nodejs-54f7b.firebaseapp.com",
    databaseURL: "https://nodejs-54f7b-default-rtdb.firebaseio.com",
    projectId: "nodejs-54f7b",
    storageBucket: "nodejs-54f7b.appspot.com",
    messagingSenderId: "647841088954",
    appId: "1:647841088954:web:03a1abd6bf64a363d7c983",
    measurementId: "G-4LBL09LTYG"
    
};
firebase.initializeApp(config);
       
router.get('/boardList',function(req, res, next) {

    firebase.database().ref('board').orderByKey().once('value',function(snapshot) {
        var rows = [];
        snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();

            childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
            rows.push(childData);

        });
        res.render('board1/boardList', {rows: rows});
    });
});
 
router.get('/boardRead',function(req, res, next) {
    firebase.database().ref('board/'+req.query.brdno).once('value',function(snapshot) {
        var childData = snapshot.val();
         
        childData.brdno = snapshot.key;
        childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
        res.render('board1/boardRead', {row: childData});
    });
});
 
router.get('/boardForm',function(req,res,next){
    if (!req.query.brdno) {
        res.render('board1/boardForm', {row:""});
        return;
    }
 
    firebase.database().ref('board/'+req.query.brdno).once('value',function(snapshot) {
        var childData = snapshot.val();
         
        childData.brdno = snapshot.key;
        res.render('board1/boardForm', {row: childData});
    });
});
 
router.post('/boardSave',function(req,res,next){
    var postData = req.body;
    
    if (!postData.brdno) {
        postData.brdno = firebase.database().ref().child('posts').push().key;
        postData.brddate = Date.now();
    }else {

        postData.brddate = Number(postData.brddate);
    }
    firebase.database().ref('board/' + req.body.brdno).set(req.body);
    //var updates = {};
    //updates['/board/' + postData.brdno] = postData;
    //firebase.database().ref().update(updates);
     
    res.redirect('boardList');
});
 
router.get('/boardDelete',function(req,res,next){
    firebase.database().ref('board/' + req.query.brdno).remove();
    res.redirect('boardList');
});
 
module.exports = router;