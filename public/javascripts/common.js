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
