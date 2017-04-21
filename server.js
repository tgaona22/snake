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

var io = require("socket.io")(server);

var users = [];

var newUser = function(id, name) {
    return {
	'id': id,
	'name': name
    };
};

var getUser = function(id) {
    return users.find(function(user) {
	return user.id === id;
    });
}

io.on('connection', function(socket) {
    console.log("a user connected...");

    socket.emit('init lobby', JSON.stringify(users));

    socket.on('new user', function(username) {
	console.log("a new user " + username + " joined...");
	users.push(newUser(socket.id, username));
	io.emit('new user', username);
	socket.emit('remove input');
    });

    socket.on('disconnect', function(reason) {
	var user = getUser(socket.id);
	if (user) {
	    console.log(user.name + ' is disconnecting...');
	    users.splice(users.indexOf(user), 1);
	    io.emit('delete user', user.name);
	}
    });
});


