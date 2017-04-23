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
	    'color': getRandomColor(),
	    'active': true
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
    obj.getActive = function() {
	return obj.users.filter(function(user) {
	    return user.active;
	});
    };

    return obj;
}

function makeGrid(width, height) {
    var obj = {
	'grid': [],
	'width': width,
	'height': height,
	'snakes': [],
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

    obj.at = function(x, y) {
	return obj.grid[y][x].entity;
    }
    obj.set = function(x, y, e) {
	obj.grid[y][x].entity = e;
    }
    obj.addSnake = function(snake) {
	snake.body.forEach(function(segment) {
	    obj.set(segment.x, segment.y, snake);
	});
	obj.snakes.push(snake);
    }
    obj.removeSnake = function(snake) {
	snake.body.forEach(function(segment) {
	    obj.set(segment.x, segment.y, null);
	});
	obj.snakes.splice(obj.snakes.indexOf(snake), 1);
    }
    obj.addFood = function() {
	// Find an unoccupied position.
	var x = getRandomInt(0, obj.width);
	var y = getRandomInt(0, obj.height);
	while (obj.at(x, y)) {
	    x = getRandomInt(0, obj.width);
	    y = getRandomInt(0, obj.height);
	}
	obj.set(x, y, 'food');
    }
    function getRandomPosition() {
	var x = getRandomInt(3, obj.width - 4);
	var y = getRandomInt(3, obj.height - 4);
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
    obj.clear = function() {
	obj.grid.forEach(function(row) {
	    row.forEach(function(cell) {
		cell.entity = null;
	    });
	});
    }
    return obj;
}

function makeSnake(id, color, grid) {
    var obj = {
	'id': id,
	'color': color,
	'body': [],
	'direction': '',
	'gridWidth': grid.width,
	'gridHeight': grid.height,
	'lastTailPosition': null
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
	obj.lastTailPosition = pos(obj.tail().x, obj.tail().y);
    }
    obj.getNextHeadPosition = function() {
	var head = obj.head()
	switch(obj.direction) {
	case 'up':
	    if (head.y === 0) {
		return pos(head.x, obj.gridHeight - 1);
	    }
	    return pos(head.x, head.y - 1);
	case 'down':
	    if (head.y === obj.gridHeight - 1) {
		return pos(head.x, 0);
	    }
	    return pos(head.x, head.y + 1);
	case 'left':
	    if (head.x === 0) {
		return pos(obj.gridWidth - 1, head.y);
	    }
	    return pos(head.x - 1, head.y);
	case 'right':
	    if (head.x === obj.gridWidth - 1) {
		return pos(0, head.y);
	    }
	    return pos(head.x + 1, head.y);
	}
    }
    obj.move = function() {
	var nextPos = obj.getNextHeadPosition();
	obj.lastTailPos = pos(obj.tail().x, obj.tail().y);
	obj.body.forEach(function(segment) {
	    var currentPos = pos(segment.x, segment.y);
	    segment.x = nextPos.x;
	    segment.y = nextPos.y;
	    nextPos = currentPos;
	});
    }
    obj.grow = function() {
	obj.body.push(obj.lastTailPos);
    }
    obj.length = function() {
	return obj.body.length;
    }
    obj.head = function() {
	return obj.body[0];
    }
    obj.tail = function() {
	return obj.body[obj.body.length - 1];
    }
    return obj;
}

/*****************************************
** Code for client/server communication **
*****************************************/
var users = makeUsers();
var grid = makeGrid(30, 20);
var gameStarted = false;
var restarting = false;
var gameClock;

var io = require("socket.io")(server);
io.on('connection', function(socket) {

    socket.emit('init lobby', JSON.stringify(users));
    // If the game has already started, don't allow new connections
    // to try to join the lobby.
    if (gameStarted) {
	socket.emit('spectate', JSON.stringify(users));
	socket.emit('setup', grid.width, grid.height);
    }

    socket.on('new user', function(username) {
	users.add(socket.id, username);
	io.emit('new user', username);
	socket.emit('remove input');
    });

    socket.on('user ready', function() {
	var user = users.getById(socket.id);
	user.ready = true;
	io.emit('user ready', user.name, user.color);
	// Once all users are ready, start the game.
	if (users.ready()) {
	    gameStarted = true;

	    // Force any sockets that are connected but not associated with a user
	    // to spectate.
	    var keys = Object.keys(io.sockets.sockets);
	    keys.forEach(function(key) {
		if (!users.getById(io.sockets.sockets[key].id)) {
		    io.sockets.sockets[key].emit('spectate', JSON.stringify(users));
		}
	    });

	    setTimeout(setup, 3000);
	}
    });

    // Used when the client informs the server about a change in direction.
    socket.on('transmit direction', function(direction) {
	var user = users.getById(socket.id);
	if (user.active) {
	    user.snake.direction = direction;
	}
    });

    socket.on('disconnect', function(reason) {
	var user = users.getById(socket.id);
	if (user) {
	    grid.removeSnake(user.snake);
	    users.remove(user);
	    io.emit('delete user', user.name);
	}
    });
});

/************************************
**** Game logic *********************
************************************/

function setup() {
    users.forEach(function(user) {
	user.snake = makeSnake(user.id, user.color, grid);
	// Choose a direction and starting position and initialize the snake.
	var dir = randomDirection();
	var pos = grid.getStartPosition(dir);
	user.snake.initialize(pos.x, pos.y, dir);
	grid.addSnake(user.snake);
	// Inform the client about the snake's initial direction
	io.to(user.id).emit('set direction', dir);
    });
    // Add food to the grid.
    var foodCount = 2;
    for (var i = 0; i < foodCount; i++) {
	grid.addFood();
    }

    // Tell the clients to create a canvas element.
    io.emit('setup', grid.width, grid.height);

    // Every 100ms, advance the game by a step.
    gameClock = setInterval(step, 100);
}

function willCollide(snake) {
    var nextPos = snake.getNextHeadPosition();
    var entity = grid.at(nextPos.x, nextPos.y);
    return (entity && entity != 'food');
}

function move(snake) {
    // Update the grid - the only changes are the tail and next head.
    var nextHeadPos = snake.getNextHeadPosition();
    var tailPos = pos(snake.tail().x, snake.tail().y);
    grid.set(nextHeadPos.x, nextHeadPos.y, snake);
    grid.set(tailPos.x, tailPos.y, null);
    // Move the snake.
    snake.move();
}

function grow(snake) {
    // Add a new tail to the snake and update the grid.
    snake.grow();
    grid.set(snake.tail().x, snake.tail().y, snake);
    // Add a new piece of food to the grid.
    grid.addFood();
}

function step() {
    // Perform collision detection.
    users.getActive().forEach(function(user) {
	// If the snake is going to collide, remove it from the grid.
	if (willCollide(user.snake)) {
	    grid.removeSnake(user.snake);
	    user.active = false;
	}
    });

    // Move and grow the snakes.
    users.getActive().forEach(function(user) {	
	var nextPos = user.snake.getNextHeadPosition();
	var willGrow = grid.at(nextPos.x, nextPos.y) === 'food';
	move(user.snake);
	if (willGrow) {
	    grow(user.snake);
	}
    });
    
    // Send the current grid state to the clients for drawing.
    io.emit('draw', JSON.stringify(grid));

    // If no active users remain, set a timer to restart the game.
    if (users.getActive().length === 0 && !restarting) {
	restarting = true;
	setTimeout(reset, 3000);
    }
}

function reset() {
    // To stop the game, stop calling step().
    clearInterval(gameClock);

    restarting = false;
    gameStarted = false;

    grid.clear();
    
    users.forEach(function(user) {
	user.ready = false;
	user.active = true;
    });
    
    // Send a reset message to the clients.
    // The reset instructions depend on whether the client was a player or spectator.
    var keys = Object.keys(io.sockets.sockets);
    keys.forEach(function(key) {
	if (!users.getById(io.sockets.sockets[key].id)) {
	    io.sockets.sockets[key].emit('reset', 'spectator');
	}
	else {
	    io.sockets.sockets[key].emit('reset', 'user');
	}
    });
}


