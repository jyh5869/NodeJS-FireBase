var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var dateFormat = require('dateformat');
var uuid = require("uuid");
var path = require("path");
var blob = require("blob");


/* 파일 업로드를 위한 multer, stream 세팅 s */
const multer = require("multer")
const stream = require("stream");

const upload = multer({
    storage: multer.memoryStorage()
});

const admin = require('firebase-admin');
var serviceAccount = require('./nodejs-54f7b-firebase-adminsdk-23c7m-1b5469b5f5.json');

var friebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://nodejs-54f7b.appspot.com'
});

const bucket = friebaseAdmin.storage().bucket();
/* 파일 업로드를 위한 multer, stream 세팅 e */

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
var db = firebase.firestore();

/* firebase-tool 명령어
    1. firebase login
    2. firebase init   - 호스팅 하기 위한 프로젝트를 생성(초기화)하기 위해 사용
    3. firebase deploy - 작성한 프로젝트를 서버에 배포할 때 사용.

    ctrl shift p  - 명령 팔렛트
*/
router.get('/boardList', async function(req, res, currentPage) {
    chkidentify(res, 'loginForm');

    var user = firebase.auth().currentUser;
  
        
        /* 첫번째 페이지  */

    const first  = db.collection('board').orderBy("brddate","desc").get()
    const snapshot = await first


    var pagingSize = 3;
    var field     = "brddate";
    var type        = "";
    var currentPage  = Number(req.query.currentPage);
    var currentDoc  = 0;
    var totalCount = snapshot.docs.length;

        //마지막페이지, 이전페이지, 첫페이지, 다음페이지 파라메터
    if(req.query.type == null){
        type = "first";
    }
    else{
        type = req.query.type;
    }


    if(req.query.currentPage == null ){//첫 페이지, 마지막 페이지 이동시
        
        if(type == 'first'){
            console.log('◎◎◎◎◎◎◎◎ 첫페이지로 이동');
            currentDoc = totalCount;
            currentPage = 1;
            
        }
        else if(type == 'last'){
            
            if(totalCount%pagingSize != 0 ){
                console.log('◎◎◎◎◎◎◎◎'+totalCount%pagingSize);
                //currentDoc = totalCount - (totalCount%pagingSize);
                currentDoc = totalCount%pagingSize;
                currentPage = Math.ceil(totalCount/pagingSize);
            }
            else{
                currentDoc = pagingSize;
                currentPage = totalCount/pagingSize ;
                console.log('●●●●●●●●●●●●●●'+totalCount%pagingSize);
            }
            
        }
    }
    else{//이전 페이지, 다음페이지 이동시
        var tempCurrentDoc ;
        if(type == 'next'){
            tempCurrentDoc = Number(totalCount - (currentPage * pagingSize));
        }
        else if(type == 'prev'){
            tempCurrentDoc = Number(totalCount - ((currentPage-2) * pagingSize));
        }
        
        if((totalCount <= (currentPage * pagingSize) && type == 'next') || (pagingSize == (currentPage * pagingSize) && type == 'prev')){//더보기할 페이지가 없을경우
            console.log("㉾㉾㉾㉾㉾㉾더보기할 페이지 없어㉾㉾㉾㉾㉾㉾");
            if(type == 'prev'){
                console.log("1111★★★11111111111111   " + totalCount);
                currentDoc = totalCount;
                currentPage = 1;
                
            }
            else if(type == 'next'){
                if(totalCount%pagingSize != 0 ){
                    console.log('◎◎◎◎◎◎◎◎'+totalCount%pagingSize);
                    currentDoc = totalCount%pagingSize;
                    currentPage = Math.ceil(totalCount/pagingSize);
                }
                else{
                    currentDoc = pagingSize;
                    currentPage = totalCount/pagingSize ;
                    console.log('●●●●●●●●●●●●●●'+totalCount%pagingSize);
                }
            }
        }
        else{
            if(type == 'prev'){
                console.log("2222★★★★★1111111111");
                currentDoc = tempCurrentDoc;
                currentPage = currentPage - 1;
            }
            else if(type == 'next'){
                console.log("2222★★★★★22222222222222222");
                currentDoc = tempCurrentDoc;
                currentPage = currentPage + 1 ;
            }
            
        }
    }

    console.log("★★★★★more = length - "+snapshot.docs.length +" ////// "+currentDoc);

    const last = snapshot.docs[snapshot.docs.length - currentDoc];


    db.collection('board').orderBy(field, "desc").startAt(last.data().brddate).limit(pagingSize).get()
        .then((snapshot) => {
            var rows = [];
            snapshot.forEach((doc) => {
                var childData = doc.data();
                childData.brddate = dateFormat(childData.brddate,"yyyy-mm-dd");
                rows.push(childData);
            });
            res.render('board3/boardList', {rows: rows, user : user, currentPage : currentPage});
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
});
 
router.get('/boardRead', async function(req, res, next) {
    chkidentify(res, 'loginForm');
    
    const user = firebase.auth().currentUser;
    
    /*
    let boardId = "";dd
    let boardData= "";
    let fileRows = "";
    */
    const brdDocRef  = db.collection('board').doc(req.query.brdno);

        const brdDoc = await brdDocRef.get();
        boardData = brdDoc.data();
            
        boardId = brdDoc.id
        //console.log("######################"+boardId + "        " + user.email);
        boardData.brddate = dateFormat(boardData.brddate,"yyyy-mm-dd hh:mm");

        
        const fileRef = db.collection('file').where('boardSq', '==', boardId);
        const fileDoc = await fileRef.get();   
                fileRows = [];
                fileDoc.forEach((doc) => {
                    var fileData = doc.data();
                    fileData.regDate = dateFormat(fileData.regDate,"yyyy-mm-dd");
                    fileRows.push(fileData);

                    console.log("＠＠＠＠＠＠＠＠＠"+fileRows);
     
         
         //db.collection('file').doc(boardId).get()

        });
   
        res.render('board3/boardRead', {row : boardData, userEmail : user.email, fileRows : fileRows});   
    

       
            
});
 
router.get('/boardForm',function(req,res,next){
    

    chkidentify(res, 'loginForm');

    if (!firebase.auth().currentUser) {
        res.redirect('loginForm');
        return;
    }

    if (!req.query.brdno) {// new
        
        var user = firebase.auth().currentUser;

        console.log("게시물 작성"+user);

        res.render('board3/boardForm', {
            row       : "",
            userEmail : user.email
        });
        return;
    }
     
    // update
    db.collection('board').doc(req.query.brdno).get()
          .then((doc) => {
              var childData = doc.data();
              var user = firebase.auth().currentUser;
              res.render('board3/boardForm', {
                  row: childData,
                  userEmail : user.email
            });
          })
});
 

/*
    -파일 객체의 속성들-

    fieldname:'single field',			// multer 세팅할때 지정한 필드명
    originalname:'20201111_39842938.jpg',	// 원본파일 이름
    encoding: '7bit',				// encoding 타입
    mimetype: 'image/jpeg',			// 파일의 mime 타입
    destination: '1606369318091.jpg',		// 저장된 파일 이름
    path: 'uploads\\1606369318091.jpg',		// 파일의 저장된 경로
    size: 2769802
*/
router.post('/boardSave', upload.single("attachFile"), function(req,res,next){
    var user = firebase.auth().currentUser;
    
    chkidentify(res, 'loginForm');
    var postData = req.body;


    /* 파일 가져오기 s */    
    if(req.file != null){
        var image = req.file;
        var bufferStream = new stream.PassThrough();
        bufferStream.end(new Buffer.from(image.buffer, 'asci'));

        /* 파일 업로드 */
        var fileName = image.originalname;
        var strUuid = uuid.v1();
        let file = friebaseAdmin.storage().bucket().file("images/"+strUuid);
        
        bufferStream.pipe(file.createWriteStream({
            metadata :{
                contentType : image.mimetype
            }
        })).on('error', (err) => {
            console.log(err);
        }).on("finish", () => {
            console.log(fileName + "   finish!!");
        });
    }
    /* 파일 가져오기 e */
    

    if (!postData.brdno) { // new
        
        /* 게시물 등록 */
        postData.brddate = Date.now(); 

        var boardDoc = db.collection("board").doc();
        postData.brdno = boardDoc.id;
        postData.brdwriter = user.email;
        boardDoc.set(postData);

        /* 첨부파일 등록 */

        var fileDoc = db.collection('file').doc();
        
        var postDataFile = {
            fileSq   : fileDoc.id,
            boardSq  : boardDoc.id,
            fileNm   : fileName,
            fileUuid : strUuid,
            regDate  : Date.now()
        };

        fileDoc.set(postDataFile);

    }
    else {               // update
        var doc = db.collection("board").doc(postData.brdno);
        postData.brddate = parseInt(postData.brddate);
        doc.update(postData);
    }
     
    res.redirect('boardList');
});
 
router.get('/boardDelete',function(req,res,next){
    chkidentify(res, 'loginForm');

    db.collection('board').doc(req.query.brdno).delete()
 
    res.redirect('boardList');
});
 

router.get('/loginForm', function(req, res, next) {
    res.render('board3/loginForm');
});

router.post('/loginChk', function(req, res, next) {
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.passwd)
       .then(function(firebaseUser) {
           res.redirect('boardList');
       })
      .catch(function(error) {
          res.redirect('loginForm');
      });   
});

function chkidentify(response, returnUrl){
    if (!firebase.auth().currentUser) {
        response.redirect(returnUrl);
        return;
    }
}


module.exports = router;