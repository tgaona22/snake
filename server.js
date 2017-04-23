// A server for a multiplayer snake game.

var http = require("http");
var fs = require("fs");

// Create the server and listen to port 2718.
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

/***********************************
*** Helper Functions ***************
***********************************/

// Taken from mozilla developer network article on Math.random().
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function randomDirection() {
    var directions = ['up', 'down', 'left', 'right'];
    return directions[getRandomInt(0, directions.length)];
}

// Taken from stack exchange answer by 'Anatoliy' at:
// http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function pos(x,y) {
    return {'x': x, 'y': y};
}

/*************************************
***** Game objects *******************
*************************************/

function makeUsers() {
    var obj = {
	'users': []
    };
    
    obj.add = function(id, name) {
	obj.users.push({
	    'id': id,
	    'name': name,
	    'ready': false,
	    'color': getRandomColor()
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

function makeGrid(width, height) {
    var obj = {
	'grid': [],
	'width': width,
	'height': height,
	'snakes': []
    };

    for (var y = 0; y < obj.height; y++) {
	var row = [];
	for (var x = 0; x < obj.width; x++) {
	    row.push({ 
		'x': x,
		'y': y,
		'entity': null
	    });
	}
	obj.grid.push(row);
    }

    obj.addSnake = function(snake) {
	snake.body.forEach(function(segment) {
	    obj.grid[segment.y][segment.x] = snake;
	});
	obj.snakes.push(snake);
    }

    function getRandomPosition() {
	var x = getRandomInt(3, obj.width - 3);
	var y = getRandomInt(3, obj.height - 3);
	return pos(x, y);
    }

    obj.getStartPosition = function(direction) {
	// Return a position that won't cause overlap with current snakes
	var pos = getRandomPosition();
	while (obj.grid[pos.y][pos.x].entity) {
	    pos = getRandomPosition();
	}
	return pos;
    }

    return obj;
}

function makeSnake(id, color) {
    var obj = {
	'id': id,
	'color': color,
	'body': [],
	'direction': ''
    };

    obj.initialize = function(x, y, dir) {
	obj.body.push(pos(x,y))
	obj.direction = dir;
	switch(dir) {
	case 'up': 
	    obj.body.push(pos(x, y+1));
	    obj.body.push(pos(x, y+2));
	    break;
	case 'down':
	    obj.body.push(pos(x, y-1));
	    obj.body.push(pos(x, y-2));
	    break;
	case 'left':
	    obj.body.push(pos(x+1, y));
	    obj.body.push(pos(x+2, y));
	    break;
	case 'right':
	    obj.body.push(pos(x-1, y));
	    obj.body.push(pos(x-2, y));
	    break;
	}
    }

    obj.length = function() {
	return obj.body.length;
    }

    obj.head = function() {
	return obj.body[0];
    }
    
    return obj;
}

/*****************************************
** Code for client/server communication **
*****************************************/
var users = makeUsers();
var grid = makeGrid(60, 40);

var io = require("socket.io")(server);
io.on('connection', function(socket) {
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
	io.emit('user ready', user.name, user.color);
	// if all users are ready, start the game.
	if (users.ready()) {
	    setup();
	    setInterval(step, 500);
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

/************************************
**** Game logic *********************
************************************/

function setup() {
    // give each user a snake.
    users.forEach(function(user) {
	user.snake = makeSnake(user.id, user.color);
	var dir = randomDirection();
	var pos = grid.getStartPosition(dir);
	user.snake.initialize(pos.x, pos.y, dir);
	grid.addSnake(user.snake);
    });
    io.emit('setup', grid.width, grid.height);
}

function step() {
    io.emit('request direction');
    //users.forEach(function(user) {

	
    io.emit('draw', JSON.stringify(grid));
}


