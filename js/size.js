$(document).ready(function(){
 
   $(window).resize(function(){
      console.log('coucou');
 
      var width = $(window).width();
      var height = $(window).height();
      
      var height_col = height-height/100*4;
      var height_dir = height_col/6;
      var height_conv = height_col*(1/2);
      var height_box = height_col/4;
      var height_map = document.getElementById("localVideo").offsetHeight;
        /*$('body').prepend('<div>' +  width + " px de        large sur " + height + ' px de haut </div>');*/
        
      document.getElementById("common-repository-area").style.height= height_dir+"px";
      /*
      document.getElementById("common-repository").style.width= '98%';
      document.getElementById("textareas").style.width= '98%';*/
      document.getElementById("dataChannelReceive").style.height= height_conv+"px";
      document.getElementById("map_canvas").style.height= height_box+"px";
      document.getElementById("historical-container-area").style.height= height_box+"px";
        
      document.getElementById("map_canvas").style.height= height_map+"px";
      
      document.getElementById("col-left").style.height= (height_col)+"px";
      document.getElementById("col-center").style.height= (height_col)+"px";
      document.getElementById("col-right").style.height= (height_col)+"px";
        
      Console.log('finCoucou');
    });
    $("#localVideo").webcam({
	   /*width: 320,
	   height: 240,*/
	   mode: "callback",
	   swffile: "/download/jscam_canvas_only.swf",
	   onTick: function() {},
	   onSave: function() {},
	   onCapture: function() {},
	   debug: function() {},
	   onLoad: function() {}
   });
});

