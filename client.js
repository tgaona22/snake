var socket = io();
var userid;

// When the user clicks the join button, tell the server a new user has joined.
var button = document.getElementById('join_button');
button.addEventListener('click', function(event) {
    var input = document.getElementById('username_input');
    if (input.value) {
	userid = input.value;
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
});

socket.on('delete user', function(name) {
    var lobby = document.getElementById('lobby');
    if (lobby.hasChildNodes()) {
	for (var i = 0; i < lobby.childNodes.length; i++) {
	    if (lobby.childNodes[i].innerHTML === name) {
		lobby.removeChild(lobby.childNodes[i]);
		return;
	    }
	}
    }
});

socket.on('init lobby', function(data) {
    var users = JSON.parse(data);
    if (users && users.length != 0) {
	var lobby = document.getElementById('lobby');
	users.forEach(function(user) {
	    var li = document.createElement('li');
	    li.innerHTML = user.name;
	    lobby.appendChild(li);
	});
    }
});    
	    
	    
    


	
