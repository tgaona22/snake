var socket = io();

// When the user clicks the join button, add their name to the lobby.
var button = document.getElementById('join_button');
button.addEventListener('click', function(event) {
    var input = document.getElementById('username_input');
    if (input.value) {
	// Tell the server that someone has joined the lobby.
	socket.emit('join lobby', input.value);
	var lobby = document.getElementById('lobby');
	var li = document.createElement('li');
	li.innerHTML = input.value;
	lobby.appendChild(li);	
	// Remove the input and button.
	document.body.removeChild(input);
	document.body.removeChild(button);
    }
});


	
