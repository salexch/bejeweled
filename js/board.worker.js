var game = {};

importScripts('board.js');

onmessage = cbEvent;


function cbEvent(event) {
	var board = game.board,
		msg = event.data;

	
	board[msg.action].apply(self, (msg.data || []).push(cb));
	
	function cb(data) {
		postMessage({
			id: msg.id,
			data: data,
			board: board.getBoard()
		});
	}	
	
}


