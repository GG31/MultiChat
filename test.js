var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var express = require('express');
var app = express();
var server = http.createServer(function (req, res) {
  file.serve(req, res);
});

app.get('/room/',function (req, res) {  
  console.log("poi ");
  res.sendfile(__dirname + '/index.html');  
  
});

app.listen(2013);
