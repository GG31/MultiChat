/*function readFilesAndDisplayPreview(files) {
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
*/
/*
$('input[type=file]').on('change', prepareUpload);
function prepareUpload(event)
{
  files = event.target.files;
}
function appendFile(fileName){
    var htmlFileName = "<li><a href='#' onclick=\"getFile('"+fileName+"');\">"+fileName+"</a>"
    $("#common-repository-ul").append(htmlFileName)
}
*/
/*var delivery = new Delivery(getSocket());
delivery.connect();
delivery.on('delivery.connect',function(delivery){
   $("input[type=submit]").click(function(evt){
      var file = $("input[type=file]")[0].files[0];
      delivery.send(file);
      evt.preventDefault();
   });
});

delivery.on('send.success',function(fileUID){
   console.log("file was successfully sent.");
});*/
window.addEventListener("load", Ready);
 
function Ready(){
    if(window.File && window.FileReader){ //These are the relevant HTML5 objects that we are going to use
        document.getElementById('UploadButton').addEventListener('click', StartUpload); 
        document.getElementById('FileBox').addEventListener('change', FileChosen);
    }
    else
    {
        document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
}
var SelectedFile;
function FileChosen(evnt) {
    SelectedFile = evnt.target.files[0];
    document.getElementById('NameBox').value = SelectedFile.name;
}

//var socket = io.connect('http://localhost:8080');
var FReader;
var Name;
function StartUpload(){
    if(document.getElementById('FileBox').value != "")
    {
        FReader = new FileReader();
        Name = document.getElementById('NameBox').value;
        var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
        Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
        Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
        document.getElementById('UploadArea').innerHTML = Content;
        FReader.onload = function(evnt){
            getSocket().emit('Upload', { 'Name' : Name, Data : evnt.target.result });
        }
        getSocket().emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
    }
    else
    {
        alert("Please Select A File");
    }
}
var Path = "http://localhost/";
 
getSocket().on('Done', function (data){
    var Content = "Video Successfully Uploaded !!"
    Content += "<img id='Thumb' src='" + Path + data['Image'] + "' alt='" + Name + "'><br>";
    Content += "<button  type='button' name='Upload' value='' id='Restart' class='Button'>Upload Another</button>";
    document.getElementById('UploadArea').innerHTML = Content;
    document.getElementById('Restart').addEventListener('click', Refresh);
});
function Refresh(){
    location.reload(true);
}

getSocket().on('MoreData', function (data){
       UpdateBar(data['Percent']);
       var Place = data['Place'] * 524288; //The Next Blocks Starting Position
       var NewFile; //The Variable that will hold the new Block of Data
       if(SelectedFile.webkitSlice)
           NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       else
           NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
       FReader.readAsBinaryString(NewFile);
   });
   function UpdateBar(percent){
       document.getElementById('ProgressBar').style.width = percent + '%';
       document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
       var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
       document.getElementById('MB').innerHTML = MBDone;
   }

function getFile(fileName){
    alert("ask for "+fileName);
    getSocket().emit("getFile",fileName);
}

function uploadFile(file){
    getSocket().emit("uploadFile",file);
    uploadFileLog(fileName)
}
