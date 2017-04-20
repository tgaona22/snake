/* A server for a multiplayer snake game. */

var http = require("http");
var fs = require("fs");

var server = http.createServer(function(request, response) {
    if (request.url === '/client.js') {
	response.writeHead(200, {"Content-Type": "text/js"});
	var fileStream = fs.createReadStream("client.js");
	fileStream.pipe(response);
    }
    else {
	response.writeHead(200, {"Content-Type": "text/html"});
	var fileStream = fs.createReadStream("client.html");    
	fileStream.pipe(response);
    }
});
server.listen(2718);
console.log("Listening on 2718...");

var io = require("socket.io")(server);
io.on('connection', function(socket) {
    console.log("a user connected...");
});
