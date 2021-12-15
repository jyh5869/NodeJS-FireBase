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


/* 파이어 베이스 접속 정보 */ 
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

router.get('/',function(req, res, next) {
    res.redirect('boardList');
});

router.get('/boardList', async function(req, res, currentPage) {
    
    //인증후 유저정보 세팅
    chkidentify(res, 'loginForm');
    var user = firebase.auth().currentUser;
        
    //게시물 갯수를 가져오기위환 세팅
    const total  = db.collection('board').orderBy("brddate","desc").get()
    const snapshot = await total;

    //파라메터 세팅
    var pagingSize  = 3;
    var field       = "brddate";
    var type        = "";
    var currentPage = Number(req.query.currentPage);
    var currentDoc  = 0;
    var totalCount  = snapshot.docs.length;

    //type : 마지막페이지, 이전페이지, 첫페이지, 다음페이지 파라메터
    if(req.query.type == null){
        type = "first";
    }
    else{
        type = req.query.type;
    }

    if(req.query.currentPage == null ){//첫 페이지, 마지막 페이지 이동시
        
        if(type == 'first'){
            
            currentDoc  = totalCount;
            currentPage = 1;
            console.log('first ----------> 첫페이지로 이동');
        }
        else if(type == 'last'){
            
            if(totalCount%pagingSize != 0 ){    
                currentDoc  = totalCount%pagingSize;
                currentPage = Math.ceil(totalCount/pagingSize);
                console.log('last ----------> type1: '+totalCount%pagingSize);
            }
            else{
                currentDoc  = pagingSize;
                currentPage = totalCount/pagingSize;
                console.log('last ----------> type2:'+totalCount%pagingSize);
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
        
        /* 
            1. 마지막페이지에서 다음버트 일떄 (더보기 페이지 없음)    
            2. 1페이지 에서 이전 페이지 버튼일때 (더보기 페이지 없음)    
        */
        if((totalCount <= (currentPage * pagingSize) && type == 'next') || (pagingSize == (currentPage * pagingSize) && type == 'prev')){//더보기할 페이지가 없을경우

            if(type == 'prev'){
                currentDoc  = totalCount;
                currentPage = 1;
                console.log("nonPage ----------> prev(첫페이지로)");
                
            }
            else if(type == 'next'){
                if(totalCount%pagingSize != 0 ){
                    currentDoc = totalCount%pagingSize;
                    currentPage = Math.ceil(totalCount/pagingSize);
                    console.log("nonPage ----------> next(마지막페이지로) type1");
                }
                else{
                    currentDoc = pagingSize;
                    currentPage = totalCount/pagingSize ;
                    console.log("nonPage ----------> next(마지막페이지로) typee2");

                }
            }
        }
        else{//더보기 할 페이지가 있을때
            if(type == 'prev'){
                currentDoc = tempCurrentDoc;
                currentPage = currentPage - 1;
                console.log("existPage ----------> prev(이전페이지로)");
            }
            else if(type == 'next'){
                currentDoc = tempCurrentDoc;
                currentPage = currentPage + 1 ;
                console.log("existPage ----------> prev(다음페이지로)");
            }
            
        }
    }

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

/* 게시물 정보 가져오기 */
router.get('/boardRead', async function(req, res, next) {
    
    chkidentify(res, 'loginForm');
    
    const user = firebase.auth().currentUser;
    const brdDocRef  = db.collection('board').doc(req.query.brdno);

    const brdDoc = await brdDocRef.get();
    boardData = brdDoc.data();
        
    boardId = brdDoc.id
    boardData.brddate = dateFormat(boardData.brddate,"yyyy-mm-dd hh:mm");

    
    const fileRef = db.collection('file').where('boardSq', '==', boardId);
    const fileDoc = await fileRef.get();   
            fileRows = [];
            fileDoc.forEach((doc) => {
                var fileData = doc.data();
                fileData.regDate = dateFormat(fileData.regDate,"yyyy-mm-dd");
                fileRows.push(fileData);       
    });

    res.render('board3/boardRead', {row : boardData, userEmail : user.email, fileRows : fileRows});       
});
 
/* 게시물 작성 or 수정 페이지로 이동 */
router.get('/boardForm',function(req,res,next){
    
    chkidentify(res, 'loginForm');

    if (!req.query.brdno) {//새 게시물 작성(new)
        
        var user = firebase.auth().currentUser;

        res.render('board3/boardForm', {
            row       : "",
            userEmail : user.email
        });
        return;
    }
     
    //게시물 정보 수정 (update)
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
    - 게시글 작성 Action
    
    ※파일 객체의 속성들※

    1. fieldname:'single field',			    // multer 세팅할때 지정한 필드명
    2. originalname:'20201111_39842938.jpg',	// 원본파일 이름
    3. encoding: '7bit',				        // encoding 타입
    4. mimetype: 'image/jpeg',			        // 파일의 mime 타입
    5. destination: '1606369318091.jpg',		// 저장된 파일 이름
    6. path: 'uploads\\1606369318091.jpg',		// 파일의 저장된 경로
    7. size: 2769802
*/
router.post('/boardSave', upload.single("attachFile"), function(req, res,next){
    
    chkidentify(res, 'loginForm');
    var user = firebase.auth().currentUser;

    var postData = req.body;

    /* 파일 가져오기 s */    
    if(req.file != null){
        var image = req.file;
        var bufferStream = new stream.PassThrough();
        bufferStream.end(new Buffer.from(image.buffer, 'asci'));

        /* 파일 업로드 */
        var fileName = image.originalname;
        var strUuid  = uuid.v1();
        let file     = friebaseAdmin.storage().bucket().file("images/"+strUuid);
        
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
    

    if (!postData.brdno) {//게시물 작성 (new)
        
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
    else {//게시물 정보 수정 (update)
        var doc = db.collection("board").doc(postData.brdno);
        postData.brddate = parseInt(postData.brddate);
        doc.update(postData);
    }
     
    res.redirect('boardList');
});
 
/* 게시물 삭제 */
router.get('/boardDelete', async function(req, res, next){
    chkidentify(res, 'loginForm');

    var boardId = req.query.brdno;//삭제될 게시물 번호

    //게시물 삭제
    db.collection('board').doc(boardId).delete();

    const fileRef = db.collection('file').where('boardSq', '==', boardId);
    const fileDoc = await fileRef.get();   
        fileDoc.forEach((doc) => {
            var fileData = doc.data();
            var fileUuid  = fileData.fileUuid;
            var fileSq   = fileData.fileSq;

            //스토리지에 업로드된 파일삭제
            friebaseAdmin.storage().bucket().file("images/"+fileUuid).delete()
            .then(function() {
                console.log("Success");
            })
            .catch(function(error) {
                console.log("Fail----->" + error);
            });

            //파일 데이터 삭제
            db.collection('file').doc(fileSq).delete()
            .then(function() {
                console.log("Success");
            })
            .catch(function(error) {
                console.log("Fail----->" + error);
            });
            
        });
    res.redirect('boardList');
});
 

/* 로그인 페이지로 이동 */
router.get('/loginForm', function(req, res, next) {
    res.render('board3/loginForm');
});

/* 로그인 Action*/
router.post('/loginChk', function(req, res, next) {
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.passwd)
       .then(function(firebaseUser) {
           res.redirect('boardList');
       })
      .catch(function(error) {
          res.redirect('loginForm');
      });   
});


/* 파일 다운로드 */
router.get('/download', async function (req, res, next) { 
    
    chkidentify(res, 'loginForm');

    //파일 참조 만들기
    var starsRef = friebaseAdmin.storage().bucket().file(req.query.filePath); 

    //스토리지 파일 경로 조립 후 다운로드 링크 제공
    starsRef.createReadStream()
    .on("error", (err) => res.status(500).json("Internal Server Error 500"))
    .on("response", (storageResponse) => {
        res.setHeader(
            "content-type",
            storageResponse.headers["content-type"]
        );
        res.setHeader(
            "content-length",
            storageResponse.headers["content-length"]
        );
        res.status(storageResponse.statusCode);
    })
    .on("end", () => res.end())
    .pipe(res);

    //res.redirect('boardRead?brdno=vlsV5bdC3GgQaaxfLRpd');
});


/* 로그인 여부 체크 */
function chkidentify(response, returnUrl){
    if (!firebase.auth().currentUser) {
        response.redirect(returnUrl);
        return;
    }
}


module.exports = router;