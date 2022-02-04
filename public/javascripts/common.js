function boardAction(url, state){
    
    if(state != "List"){

        var flag = confirm(state +" 하시겠습니까?");

        if(flag == true){
            location.href = url;
        }
        else{
            return false;
        }
    
    }
    else{
        var flag = confirm("작업을 중지하고 "+ state +"로 돌아 가시겠습니까?");

        if(flag == true){
            location.href = url;
        }
        else{
            return false;
        }
    }

}


/* 엔티티 문자 변환 함수 ex) &lt; -> '<' */
function decodeHTMLEntities (str) {
    if(str !== undefined && str !== null && str !== '') {
        str = String(str);

        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
        var element = document.createElement('div');
        element.innerHTML = str;
        str = element.textContent;
        element.textContent = '';
    }

    return str;
}