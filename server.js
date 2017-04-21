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

function makeUsers() {
    var obj = {
	'users': []
    };
    
    obj.add = function(id, name) {
	obj.users.push({
	    'id': id,
	    'name': name,
	    'ready': false
	});
    };
    obj.remove = function(user) {
	obj.users.splice(obj.users.indexOf(user), 1);
    };
    obj.getById = function(id) {
	return obj.users.find(function(user) {
	    return user.id === id;
	});
    };
    obj.ready = function() {
	var unready = obj.users.filter(function(user) {
	    return user.ready === false;
	});
	return unready.length === 0;
    };
    obj.forEach = function(fn) {
	obj.users.forEach(fn);
    };

    return obj;
}

var users = makeUsers();
console.log(users);

io.on('connection', function(socket) {
    console.log("a user connected...");

    socket.emit('init lobby', JSON.stringify(users));

    socket.on('new user', function(username) {
	console.log("a new user " + username + " joined...");
	users.add(socket.id, username);
	io.emit('new user', username);
	socket.emit('remove input');
    });

    socket.on('user ready', function() {
	var user = users.getById(socket.id);
	user.ready = true;
	socket.broadcast.emit('user ready', user.name);
	// if all users are ready, start the game.
	if (users.ready()) {
	    console.log('all users ready - can start game.');
	}
    });

    socket.on('disconnect', function(reason) {
	var user = users.getById(socket.id);
	if (user) {
	    console.log(user.name + ' is disconnecting...');
	    users.remove(user);
	    io.emit('delete user', user.name);
	}
    });
});


