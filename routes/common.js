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

/* 파일 다운로드 */
router.get('/download', async function (req, res, next) { 
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

router.get('/Read', function (req, res, next) {
    firebaseAdmin.firestore().collection('posts').doc(req.query.postsno).get()
        .then((snapshot) => {
            var childData = snapshot.data();

            // 글에 포함된 이미지 링크들 추출
            var gsLinks = getSrc(childData.postsmemo);

            const config = {
                action: 'read',
                expires: '03-17-2030'
            };

            function callback() {
                childData.postsdate = dateFormat(childData.postsdate, "yyyy-mm-dd TT hh:mm:ss");
                res.render('storage/Read', { row: childData });
            }

            var imgCount = 0;

            if (gsLinks != null) {
                gsLinks.forEach(element => {
                    var file = refFromURL(element);
                    //console.log(file);

                    file.getSignedUrl(
                        config, (error, url) => {
                            if (error) {
                                console.log(error);
                            }
                            childData.postsmemo = childData.postsmemo.replace(element, url);
                            imgCount++;

                            if (imgCount === gsLinks.length)
                                return callback();
                        });
                });
            }
            else return callback();
        }).catch((err) => {
            console.log(err);
        });
});


// 공지 저장 위치
const postsSavePath = "posts/";

router.post('/Save', function (req, res, next) {
    var imgData = JSON.parse(req.body.imgArray);

    var postData = req.body;

    try {
        var bucket = firebaseAdmin.storage().bucket();

        // 글에 들어있는 이미지들 firebase storage에 업로드
        imgData.forEach(element => {
            var bufferStream = new stream.PassThrough();
            bufferStream.end(new Buffer.from(element.img, 'base64'));

            var fileName = postsSavePath + postData.poststitle + '/' + element.Name + '.' + element.imgType;
            let file = bucket.file(fileName);

            bufferStream.pipe(file.createWriteStream({
                metadata: {
                    contentType: 'image/' + element.imgType
                }
            })).on('error', (err) => { console.log(err); })
                .on('finish', () => { console.log(fileName + ' upload Complate!'); });

            // gsLink 제작
            var gsLink = creFromURL('testproject-bc8ea.appspot.com', "/" + fileName);

            // 글에 삽입되어 있는 이미지 링크들 변경
            postData.postsmemo = postData.postsmemo.replace(element.base64Cut + element.img, gsLink);
        });

        //console.log(postData.postsmemo);
    } catch (err) {
        console.log(err);
    }

    if (!postData.postsno) {
        postData.postsdate = Date.now();

        var doc = firebaseAdmin.firestore().collection('posts').doc();
        postData.postsno = doc.id;
        doc.set(postData);

        doc.update({
            imgArray: admin.firestore.FieldValue.delete()
        });
    }
    else {
        doc = firebaseAdmin.firestore().collection('posts').doc(postData.postsno);
        doc.update(postData);

        doc.update({
            imgArray: admin.firestore.FieldValue.delete()
        });
    }

    res.redirect('List');
    return;
});

module.exports = router;

