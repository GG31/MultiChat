getSocket().emit('upload', fs.);

function appendFile(fileName){
    var htmlFileName = "<li><a href='#' onclick=\"getFile('"+fileName+"');\">"+fileName+"</a>"
    $("#common-repository-ul").append(htmlFileName)
}

function getFile(fileName){
    alert("ask for "+fileName);
    getSocket().emit("getFile",fileName);
}

function uploadFile(file){
    getSocket().emit("uploadFile",file);
    uploadFileLog(fileName)
}
