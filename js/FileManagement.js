function appendFile(fileName){
    var htmlFileName = "<li><a href='#' onclick=\"getFile('"+fileName+"');\">"+fileName+"</a>"
    $("#common-repository-ul").append(htmlFileName)
}