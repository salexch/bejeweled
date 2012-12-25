game.board = (function() {
	var settings,
		callbacks,
		msg_id,
		worker;
	
	function init(cb) {
		settings = game.settings;
		msg_id = 0;
		callbacks = [];
		worker = new Worker('js/board.worker.js');
		
		worker.onmessage = msgHandler; 
		
		post('init', [settings], cb);
	}
	
	
	function post(action, data, cb) {
		callbacks[msg_id] = cb;
		worker.postMessage({
			id: msg_id,
			action: action,
			data: data || []
		});
		
		msg_id++;
	}
	
	
	function msgHandler(event) {
		var msg = event.data;
		
		if (callbacks[msg.id]) {
			callbacks[msg.id](msg.data);
			delete callbacks[msg.id];
		}
	}
	
	
	function doSwap(j1, j2, cb) {
		post('doSwap', [j1, j2], cb);
	}
	
	
	return {
		init: init,
		doSwap: doSwap,
		getBoard: getBoard,
		print: print
	};
	
})();