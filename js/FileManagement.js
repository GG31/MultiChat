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
    linkOnClick();
}

function linkOnClick() {
   console.log("on function");
   getSocket().emit('download');
}

var SelectedFile;
function FileChosen(evnt) {
    SelectedFile = evnt.target.files[0];
    document.getElementById('NameBox').value = SelectedFile.name;
}

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
//var Path = "files/n/";
 
/*getSocket().on('Done', function (data){
    var Content = "Video Successfully Uploaded !!";
    Content += '<a href="" target="_blank">Download</a>';
    Content += "<img id='Thumb' src='" + Path + data['file'] + "' alt='" + Name + "'><br>";
    Content += "<button  type='button' name='Upload' value='' id='Restart' class='Button'>Upload Another</button>";
    document.getElementById('UploadArea').innerHTML = Content;
    document.getElementById('Restart').addEventListener('click', Refresh);
});*/

getSocket().on('download', function (data){
    var blob = new Blob([data['buffer']], {type: "application/octet-binary"});
    var a = document.getElementById('downloadFile');
    a.href = window.URL.createObjectURL(blob);
    a.download = data['name'];
    a.click();
});

function download(content, filename, contentType)
{
    if(!contentType) contentType = 'application/octet-stream';
        var a = document.createElement('a');
        var blob = new Blob([content], {'type':contentType});
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
}
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
