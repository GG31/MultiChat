$(document).ready(function(){
 
   $(window).resize(function(){
 
      var width = $(window).width();
      var height = $(window).height();
      var height_percent = height/100;
      
      var height_col = height-height_percent*4;
      var height_dir = height_col/6;
      var height_conv = height_col*(1/2);
      var height_box = height_col/4;
      var height_profil = height_col*(3/5);
      var height_map = document.getElementById("localVideo").offsetHeight;
      // ou width / 1.33
        
      document.getElementById("common-repository-area").style.height= height_dir+"px";
      document.getElementById("dataChannelReceive").style.height= height_conv+"px";
      document.getElementById("map_canvas").style.height= height_box+"px";
      document.getElementById("historical-container-area").style.height= height_box+"px";
      document.getElementById("profils-container").style.height= height_profil+"px";
        
      document.getElementById("map_canvas").style.height= height_map+"px";
      
      document.getElementById("col-left").style.height= (height_col)+"px";
      document.getElementById("col-center").style.height= (height_col)+"px";
      document.getElementById("col-right").style.height= (height_col)+"px";
    });
    /*
    $("#localVideo").webcam({
	   mode: "callback",
	   swffile: "/download/jscam_canvas_only.swf",
	   onTick: function() {},
	   onSave: function() {},
	   onCapture: function() {},
	   debug: function() {},
	   onLoad: function() {}
   });*/
});

