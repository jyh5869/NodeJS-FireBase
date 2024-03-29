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

// 파일 저장 위치 1. 이미지 , 2. 문서
const imgSavePath = "images/";
const docSavePath   = "documents/";

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
    var pagingSize  = 5;
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
                //새로운 게시물(하루전), 업데이트된(하루전) 게시물 세팅
                const today       = new Date();
                const brdDate     = new Date(childData.brddate);
                const modiDate    = new Date(childData.modidate);

                const refNewDate = new Date(brdDate.getFullYear(), brdDate.getMonth(), brdDate.getDate() +1 ,brdDate.getHours(), brdDate.getMinutes(), brdDate.getSeconds(), brdDate.getMilliseconds() );
                const refUpdDate = new Date(modiDate.getFullYear(), modiDate.getMonth(), modiDate.getDate() +1 ,modiDate.getHours(), modiDate.getMinutes(), modiDate.getSeconds(), modiDate.getMilliseconds());

                childData.newYn    = today <= refNewDate ? "Y" : "N";
                childData.updateYn = today <= refUpdDate ? "Y" : "N";

                childData.brddate  = dateFormat(childData.brddate ,"yyyy-mm-dd");
                childData.modidate = dateFormat(childData.modidate,"yyyy-mm-dd");

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

    res.render('board3/boardRead', {row : boardData, user : user, fileRows : fileRows});       
});
 
/* 게시물 작성 or 수정 페이지로 이동 */
router.get('/boardForm',async function(req, res,next){
    
    chkidentify(res, 'loginForm');
    const user = firebase.auth().currentUser;
    
    var boardType = req.query.boardType;

    if (!req.query.brdno) {//새 게시물 작성(new)
        if(boardType == "normal"){//일반 글 작성하기
            res.render('board3/boardForm', {//2. 단순 다중 파일첨부 글쓰기      
                row       : "",
                fileRows  : "",
                boardType : boardType,
                user      : user ,
                actionType : "insert"
            });
        }
        else{//Quill 에디터 글 작성하기
            res.render('board3/boardFormQuill', {//1. Quill 에디터를 이용한 글 쓰기
            //res.render('board3/boardForm', {//2. 단순 다중 파일첨부 글쓰기      
            row       : "",
            fileRows  : "",
            boardType : boardType,
            user      : user ,
            actionType : "insert"
        });
        }

        return;
    }
     
    //게시물 정보 수정 (update)
    if(boardType == "normal"){//일반 글 업데이트

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

        res.render('board3/boardForm', {row : boardData, user : user, fileRows : fileRows, actionType : "modify"});
    }
    else {//Quill 에디터 글 업데이트

        db.collection('board').doc(req.query.brdno).get()
            .then((doc) => {
                var childData = doc.data();
                var user = firebase.auth().currentUser;
                res.render('board3/boardFormQuill', {//1. Quill 에디터를 이용한 글 쓰기
                //res.render('board3/boardForm', { //2. 단순 다중 파일첨부 글쓰기
                    row: childData,
                    user : user,
                    actionType : "modify"
            });
        })
    }
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
var multiparty = require('multiparty');
const { request } = require('http');

const formidable = require('formidable')
var fs = require('fs')
var filePath = "C:/service/"
router.post('/boardSave', async function(req, res,next){
    
    chkidentify(res, 'loginForm');
    var user = firebase.auth().currentUser;

    /* 파일 존재 여부 확인 후 파일 등록 s */    
    var form = new formidable.IncomingForm();

    form.uploadDir = filePath 
    form.keepExtension =true
    form.multiples =true

    fileCnt       = 0;
    arrayPath     = [];
    arraySaveName = [];
    arrayRealName = [];
    arrayMimetype = [];

    form.on('fileBegin', function (name, file){
        console.log(file)
        var saveFileName   = uuid.v1();
        var originFileName = file.originalFilename
        arrayMimetype.push(file.mimetype);
        //file.filepath = filePath + file.originalFilename;
        file.filepath = filePath + saveFileName +"."+ originFileName.split(".")[1];
        //console.log(originFileName.split(".")[1]);
        arraySaveName.push(saveFileName);
        arrayRealName.push(originFileName);
        //console.log(file.filepath);
    });

    form.on('file', function (name, file){

        arrayPath.push(file.filepath);
        
        fileCnt++;
        console.log("fileCNt---------------> "+fileCnt);
    });
    form.parse(req, async function(err, fields, files) {
        console.log(fields);

        var postData = fields;

        /* 신규일경우 게시물 등록, 수정일 경우 게시물 수정 및 기존 첨부파일 삭제 */
        var boardDoc = db.collection("board").doc();

        if (!postData.brdno) { //게시물 작성 (new)

            var postData = {
                brdno     : boardDoc.id,
                brdtitle  : postData.brdtitle,
                brdmemo   : postData.brdmemo,
                brdwriter : postData.brdwriter,
                brdType   : postData.brdType,
                brddate   : Date.now(),
                modidate  : Date.now()
            };
    
            boardDoc.set(postData);
        }
        else {//게시물 정보 수정 (update)
            boardDoc = db.collection("board").doc(postData.brdno);
            boardDoc.update({
                brdno     : postData.brdno,
                brdtitle  : postData.brdtitle,
                brdmemo   : postData.brdmemo,
                brdwriter : postData.brdwriter,
                modidate  : Date.now()
            });
            
            //첨부파일 전체 삭제(스토리지, 파일 데이터)
            const fileRef = db.collection('file').where('boardSq', '==', postData.brdno);
            const fileDoc = await fileRef.get();   
            
            //삭제될 파일 UUID 배열 리스트
            var fileDelArray = postData.fileDelArray.split("|");
            
            fileDoc.forEach((doc) => {
                var fileData  = doc.data();
                var fileUuid  = fileData.fileUuid;
                var fileSq    = fileData.fileSq;

                //삭제될 배열에 포함되지 않을 경우 Return
                if(!fileDelArray.includes(fileUuid)){
                    return;
                }

                console.log("삭제된 파일 UUID : " + fileUuid);

                //스토리지에 업로드된 파일삭제
                friebaseAdmin.storage().bucket().file("images/"+fileUuid).delete()
                .then(function() {
                    console.log("Success delete File");
                })
                .catch(function(error) {
                    console.log("Fail----->" + error);
                });

                //파일 데이터 삭제
                db.collection('file').doc(fileSq).delete()
                .then(function() {
                    console.log("Success delete Data");
                })
                .catch(function(error) {
                    console.log("Fail----->" + error);
                });
            });
        }

        for (var i = 0; i < fileCnt; i++) {

            var saveFilePath = arrayPath[i];
            var saveFileName = arraySaveName[i];
            var realFileName = arrayRealName[i];
            var saveMimeType = arrayMimetype[i];
            console.log(arrayMimetype);
            var image = fs.readFileSync(saveFilePath, function(err, data){ });//버퍼로 가져옴
            
            var bufferStream = new stream.PassThrough();
            bufferStream.end(new Buffer.from(image, 'asci'));
    
            /* 파일 업로드 */
            let file     = friebaseAdmin.storage().bucket().file( imgSavePath + saveFileName);
            bufferStream.pipe(file.createWriteStream({
                metadata :{
                    contentType : saveMimeType
                }
            })).on('error', (err) => {
                console.log(err);
            }).on("finish", () => {
                
                //임시경로 파일 삭제
                fs.unlink(saveFilePath, err => {});
                
                console.log(saveFileName + "   finish!!");
            });

            /* 파일 데이터 저장 */
            var fileDoc = db.collection('file').doc();

            var postDataFile = {
                fileSq   : fileDoc.id,
                boardSq  : boardDoc.id,
                fileNm   : realFileName,
                fileUuid : saveFileName,
                regDate  : Date.now()
            };

            fileDoc.set(postDataFile);   
        }
    });
    /* 파일 가져오기 e */
     
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
            var fileData  = doc.data();
            var fileUuid  = fileData.fileUuid;
            var fileSq    = fileData.fileSq;

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
    res.render('board3/loginForm',  { menuType : 'board'});
});

/* 로그인 Action*/
router.post('/loginChk', function(req, res, next) {
    firebase.auth().signInWithEmailAndPassword(req.body.id, req.body.passwd)
       .then(function(firebaseUser) {
           res.redirect('boardList');
       })
      .catch(function(error) {
          res.redirect('loginForm', error);
      });   
});

/* 로그아웃 Action */
router.get('/logoutAction', function(req, res, next) {
    firebase.auth().signOut()
       .then(function(firebaseUser) {
           res.redirect('loginForm');
       })
      .catch(function(error) {
          res.redirect('loginForm', error);
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
});

/* 에디터를 이용한 게시물 읽기 */
router.get('/boardReadQuill', function (req, res, next) {
    chkidentify(res, 'loginForm');

    var user = firebase.auth().currentUser;//로그인한 사용자 정보

    db.collection('board').doc(req.query.brdno).get()
        .then((snapshot) => {
            var childData = snapshot.data();
            // 글에 포함된 이미지 링크들 추출
            var gsLinks = getSrc(childData.brdmemo);

            const config = {
                action: 'read',
                expires: '03-17-2030'
            };

            function callback() {
                childData.brddate = dateFormat(childData.brddate, "yyyy-mm-dd TT hh:mm:ss");
                res.render('board3/boardFormQuill', { row: childData, user : user, actionType : "modify" });
            }

            var imgCount = 0;

            if (gsLinks != null) {
                gsLinks.forEach(element => {
                    var file = refFromURL(element);

                    file.getSignedUrl( config, (error, url) => {
                        if (error) {
                            console.log(error);
                        }
                        childData.brdmemo = childData.brdmemo.replace(element, url);
                        
                        console.log(childData.brdmemo)
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


/* 에디터를 이용한 게시물 및 첨부파일 저장 */
router.post('/boardSaveQuill', function (req, res, next) {
    chkidentify(res, 'loginForm');

    var user = firebase.auth().currentUser;//로그인한 사용자 정보
    var imgData = JSON.parse(req.body.imgArray);//이미지 배열
    var postData = req.body;//파라메터

    try {
        var bucket = friebaseAdmin.storage().bucket();

        // 글에 들어있는 이미지들 firebase storage에 업로드 (이거 포문으로 바꿔 병렬)
        imgData.forEach(element => {
            var bufferStream = new stream.PassThrough();
            bufferStream.end(new Buffer.from(element.img, 'base64'));
            
            //var fileName = imgSavePath + postData.poststitle + '/' + element.Name + '.' + element.imgType;
            var strUuid  = uuid.v1();
            var fileName = imgSavePath + strUuid + "."+ element.imgType;
            
            let file = bucket.file(fileName);

            
            bufferStream.pipe(file.createWriteStream({
                metadata: {
                    contentType: 'image/' + element.imgType
                }
            })).on('error', (err) => { console.log(err); })
                .on('finish', () => { console.log(fileName + ' upload Complate!'); });

            // gsLink 제작
            var gsLink = creFromURL('nodejs-54f7b.appspot.com', "/" + fileName);

            // 글에 삽입되어 있는 이미지 링크들 변경
            postData.brdmemo = postData.brdmemo.replace(element.base64Cut + element.img, gsLink);

        });

        console.log(postData.brdmemo);
    } 
    catch (err) {
        console.log(err);
    }


    //게시글 신구 등록 및 변경
    if (!postData.brdno) {//신규

        postData.brddate = Date.now(); 

        var boardDoc = db.collection("board").doc();
        postData.brdno = boardDoc.id;
        postData.brdwriter = user.email;

        var postData = {
            brdno     : postData.brdno,
            brdtitle  : postData.brdtitle,
            brdmemo   : postData.brdmemo,
            brdwriter : postData.brdwriter,
            brdType   : postData.brdType,
            brddate   : Date.now(),
            modidate  : Date.now()
        };

        boardDoc.set(postData);
    }
    else {//변경

        boardDoc = db.collection('board').doc(postData.brdno);

        boardDoc.update({
            brdno     : postData.brdno,
            brdtitle  : postData.brdtitle,
            brdmemo   : postData.brdmemo,
            brdwriter : postData.brdwriter,
            modidate  : Date.now()
        });
    }
    res.redirect('boardList');

});

//////////////////////////////////////////////////////////
/////////////////////////공통함수//////////////////////////
//////////////////////////////////////////////////////////

/* 로그인 여부 체크 */
function chkidentify(response, returnUrl){
    if (!firebase.auth().currentUser) {
        response.redirect(returnUrl);
        return;
    }
}

/* 파일 링크를 이용하여 파일 오브젝트 만들기 */  
function refFromURL(gsLink) { 
    var fileEntryTemp = gsLink.replace("gs://", ""); 
    var bucketName = fileEntryTemp.substring(0, fileEntryTemp.indexOf("/")); 
    var filename = gsLink.match("gs://" + bucketName + "/" + "(.*)")[1]; 
    var file = friebaseAdmin.storage().bucket().file(filename); 
    
    return file; 
} 
/* 파일 링크 생성 */
function creFromURL(bucketName, fileName) { 
    var gsLink = "gs://" + bucketName + fileName; 
    
    return gsLink; 
} 
/* 이미지 경로 추출 */
function getSrc(str) { 
    var strReg = new RegExp("gs://*[^>]*\\.(jpg|gif|png|jpeg)","gim"); 
    var xArr = str.match(strReg); 
    
    return xArr; 
}


module.exports = router;