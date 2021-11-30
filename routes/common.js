var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var dateFormat = require('dateformat');
var uuid = require("uuid");
var path = require("path");
var blob = require("blob");

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

if (!firebase.apps.length) {
    firebase.initializeApp(config);
} 
else {
    firebase.app();
}

var db = firebase.firestore();


router.get('/download', function (req, res, next) { 
    var imgName = req.query.imgName; 
    var file = firebaseAdmin.storage().bucket().file(imgName); 
    
    const config = { 
        action: "read", 
        expires: '03-17-2030' 
    }; 

    file.getSignedUrl(config, (err, url) => {
        if (err) { 
            console.log(err); 
        } 
        console.log(url); 

        res.render('storage/download', {
          image: url 
        }); 

    return; 
    }); 
});

module.exports = router;

