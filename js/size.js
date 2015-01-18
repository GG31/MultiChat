$(document).ready(function(){
 
   $(window).resize(function(){
 
      var width = $(window).width();
      var height = $(window).height();
      
      var height_dir = height/6;
      var height_conv = height*(1/2);
      var height_box = height/4;
      var height_map = document.getElementById("localVideo").offsetHeight;
        /*$('body').prepend('<div>' +  width + " px de        large sur " + height + ' px de haut </div>');*/
        
      document.getElementById("common-repository-area").style.height= height_dir+"px";
      document.getElementById("common-repository").style.width= '98%';
      document.getElementById("textareas").style.width= '98%';
      document.getElementById("dataChannelReceive").style.height= height_conv+"px";
      document.getElementById("map_canvas").style.height= height_box+"px";
      document.getElementById("historical-container-area").style.height= height_box+"px";
        
      document.getElementById("map_canvas").style.height= height_map+"px";
        
 
    });
});

