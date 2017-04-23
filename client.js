var socket = io();
var codes = {37: 'left', 38: 'up', 39: 'right', 40: 'down'};
var direction;
var spectator = false;

var oppositeDirection = function(dir) {
    switch(dir) {
    case 'left':
	return 'right';
    case 'right':
	return 'left';
    case 'up':
	return 'down';
    case 'down':
	return 'up';
    }
}

// Listen for a key press to change direction.
addEventListener('keydown', function(event) {
    if (!spectator) {
	if (codes.hasOwnProperty(event.keyCode)) {
	    // Don't allow the user to reverse direction and commit suicide.
	    if (codes[event.keyCode] !== oppositeDirection(direction)) {
		direction = codes[event.keyCode];
		socket.emit('transmit direction', direction);
	    }
	    event.preventDefault();
	}
    }
});

var findLobbyNode = function(name) {
    var lobby = document.getElementById('lobby');
    for (var i = 0; i < lobby.childNodes.length; i++) {
	if (lobby.childNodes[i].innerHTML === name) {
	    return lobby.childNodes[i];
	}
    }
}

// When the user clicks the join button, tell the server a new user has joined.
var button = document.getElementById('join_button');
button.addEventListener('click', function(event) {
    var input = document.getElementById('username_input');
    if (input.value) {
	socket.emit('new user', input.value);
    }
});

// When the server responds with a new user, add them to the lobby.
socket.on('new user', function(username) {
    var lobby = document.getElementById('lobby');
    var li = document.createElement('li');
    li.innerHTML = username;
    lobby.appendChild(li);
});

socket.on('remove input', function() {
    document.body.removeChild(document.getElementById('username_input'));
    document.body.removeChild(document.getElementById('join_button'));
    // Make a 'ready' button.
    var ready_button = document.createElement('button');
    ready_button.innerHTML = 'Ready';
    // When the user is ready, mark their name green and notify the server.
    ready_button.addEventListener('click', function(event) {
	socket.emit('user ready');
	document.body.removeChild(ready_button);
    });	
    document.body.appendChild(ready_button);
});

socket.on('delete user', function(name) {
    var toRemove = findLobbyNode(name);
    if (toRemove) {
	lobby.removeChild(toRemove);
    }
});

socket.on('init lobby', function(data) {
    var users = JSON.parse(data).users;
    if (users && users.length != 0) {
	var lobby = document.getElementById('lobby');
	users.forEach(function(user) {
	    var li = document.createElement('li');
	    li.innerHTML = user.name;
	    lobby.appendChild(li);
	});
    }
});

socket.on('spectate', function(data) {
    // Remove the input and join buttons.
    spectator = true;
    document.body.removeChild(document.getElementById('join_button'));
    document.body.removeChild(document.getElementById('username_input'));
    var users = JSON.parse(data).users;
    users.forEach(function(user) {
	findLobbyNode(user.name).style.color = user.color;
    });
});

socket.on('user ready', function(name, color) {
    findLobbyNode(name).style.color = color;
});

socket.on('set direction', function(dir) {
    direction = dir;
});

var scale = 12;
socket.on('setup', function(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    document.body.prepend(canvas);
});

socket.on('user reset', function() {
    // Remove the canvas.
    var canvas = document.getElementsByTagName('canvas')[0];
    if (canvas) {
	document.body.removeChild(canvas);
    }        
    // Add the ready button again.
    var ready_button = document.createElement('button');
    ready_button.innerHTML = 'Ready';
    // When the user is ready, mark their name green and notify the server.
    ready_button.addEventListener('click', function(event) {
	socket.emit('user ready');
	document.body.removeChild(ready_button);
    });	
    document.body.appendChild(ready_button);
    // Reset the color of the users in the lobby.
    var nodes = document.getElementsByTagName('li');
    for (var i = 0; i < nodes.length; i++) {
	nodes[i].style.color = 'black';
    }
});

socket.on('spectator reset', function() {
    // Remove the canvas.
    var canvas = document.getElementsByTagName('canvas')[0];
    if (canvas) {
	document.body.removeChild(canvas);
    }    
    var input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'username_input');
    var joinButton = document.createElement('button');
    joinButton.setAttribute('id', 'join_button');
    joinButton.addEventListener('click', function(event) {
	if (input.value) {
	    socket.emit('new user', input.value);
	}
    });
    joinButton.innerHTML = 'Join';
    document.body.prepend(joinButton);
    document.body.prepend(input);
    // Reset the color of the users in the lobby.
    var nodes = document.getElementsByTagName('li');
    for (var i = 0; i < nodes.length; i++) {
	nodes[i].style.color = 'black';
    }    
});

var drawSnakeHead = function(ctx, snake) {
    var head = snake.body[0];

    ctx.save();

    // Set the coordinate system so the head is properly oriented.
    ctx.translate(head.x * scale + scale/2.0, head.y * scale + scale/2.0);
    switch(snake.direction) {
    case 'right':
	break;
    case 'down':
	ctx.rotate(Math.PI / 2.0);
	break;
    case 'left':
	ctx.rotate(Math.PI);
	break;
    case 'up':
	ctx.rotate(Math.PI * 3.0 / 2);
	break;
    }
    ctx.beginPath();
    ctx.arc(-scale/2.0, 0, scale/2.0, Math.PI * 3.0 / 2.0, Math.PI / 2.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = 'black';
    // draw the eyes.
    ctx.beginPath();
    ctx.arc(-scale/4.0, -scale/4.0, scale/8.0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-scale/4.0, scale/4.0, scale/8.0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    // draw the tongue.
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(4, 0);
    ctx.lineTo(7, 2);
    ctx.moveTo(4, 0);
    ctx.lineTo(7, -2);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

socket.on('draw', function(data) {
    data = JSON.parse(data);
    var grid = data.grid;

    var canvas = document.getElementsByTagName('canvas')[0];
    var ctx = canvas.getContext('2d');
    // Draw the background.
    ctx.fillStyle = 'tan';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the snakes.
    data.snakes.forEach(function(snake) {
	ctx.fillStyle = snake.color;
	ctx.strokeStyle = 'black';
	drawSnakeHead(ctx, snake);
	snake.body.slice(1).forEach(function(segment) {
	    ctx.fillRect(segment.x * scale, segment.y * scale, scale, scale);
	    ctx.strokeRect(segment.x * scale, segment.y * scale, scale, scale);
	});
    });

    // Draw the food.
    ctx.fillStyle = 'red';
    grid.forEach(function(row) {
	row.forEach(function(cell) {
	    if (cell.entity === 'food') {
		ctx.beginPath();
		ctx.arc((cell.x * scale) + (scale/2.0), (cell.y * scale) + (scale/2.0), scale/3.0, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	    }
	});
    });
		   
});


    
    
