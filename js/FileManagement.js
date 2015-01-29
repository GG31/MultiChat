function readFilesAndDisplayPreview(files) {
    // Loop through the FileList and render image files as thumbnails.
    // Only process image files.
      if (files[0].type.match('image.*')) {
      
      var reader = new FileReader();
      //capture the file information.
      reader.onload = function(e) {
          // Render thumbnail.
          getSocket().emit('upload', e.target.result);
        };
      // Read in the image file as a data URL.
      reader.readAsDataURL(files[0]);
    }
}
function handleFileSelect(evt) {
   var files = evt.target.files; // FileList object
   readFilesAndDisplayPreview(files);
}
document.getElementById('files').addEventListener('change', handleFileSelect, false);

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
