/* ******************************************************
DRAG AND DROP MANAGEMENT
****************************************************** */
    
      
      function dragEnterHandler(event) {
        console.log("Drag enter");
        // Show some visual feedback
        document.getElementById("droppableZone").classList.add('draggedOver'); 
      }
      
      function dropHandler(event) {
          console.log('drop event');
          document.getElementById("droppableZone").classList.remove('draggedOver'); 
        
         // Do not propagate the event
         event.stopPropagation();
         // Prevent default behavior, in particular when we drop images or links
          event.preventDefault(); 
        
      
        // reset the visual look of the drop zone to default
        event.target.classList.remove('draggedOver'); 
        
       
        // get the files from the clipboard
        var files = event.dataTransfer.files;
        var filesLen = files.length; 
        var filenames = "";
        if(filesLen > 0){
         SelectedFile = files[filesLen-1];
           //FileChosen(event, filesLen-1);
           StartUpload();
        }
 
        // iterate on the files, get details using the file API
        // Display file names in a list.
       for(var i = 0 ; i < filesLen ; i++) {
           filenames += '\n' + files[i].name; 
           // Create a li, set its value to a file name, add it to the ol
           var li = document.createElement('li');
           li.textContent = files[i].name;    
           document.querySelector("#droppedFiles").appendChild(li);
       }
     console.log(files.length + ' file(s) have been dropped:\n' + filenames);
        
    }  
