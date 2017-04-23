var socket = io();
var codes = {37: 'left', 38: 'up', 39: 'right', 40: 'down'};
var direction;

// Listen for a key press to change direction.
addEventListener('keydown', function(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
	direction = codes[event.keyCode];
	event.preventDefault();
	console.log(direction);
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

socket.on('user ready', function(name, color) {
    findLobbyNode(name).style.color = color;
});

socket.on('request direction', function() {
    socket.emit('transmit direction', direction);
});

var scale = 10;
socket.on('setup', function(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    document.body.prepend(canvas);
});

socket.on('draw', function(data) {
    data = JSON.parse(data);
    var grid = data.grid;

    var canvas = document.getElementsByTagName('canvas')[0];
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'tan';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    data.snakes.forEach(function(snake) {
	ctx.fillStyle = snake.color;
	ctx.strokeStyle = 'black';
	snake.body.forEach(function(segment) {
	    ctx.fillRect(segment.x * scale, segment.y * scale, scale, scale);
	    ctx.strokeRect(segment.x * scale, segment.y * scale, scale, scale);
	});
    });

});
    
    
