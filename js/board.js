	function clone(obj){
	    if(obj == null || typeof(obj) != 'object')
	        return obj;

	    var temp = new obj.constructor();
	    for(var key in obj)
	        temp[key] = clone(obj[key]);

	    return temp;
	}

game.board = (function() {
	
	var defaults = {
			jewel_types : '1234',
			rows: 8,
			cols: 8,
			base_score: 100
	},
	
	rows,
	cols,
	jewel_types,
	base_score,
	
	board = [];
	
	
	function init(settings, cb) {
		var opts = clone(defaults);
		
		for(var i in settings)
			opts[i] = settings[i];
		
		rows = opts.rows;
		cols = opts.cols;
		jewel_types = opts.jewel_types;
		base_score = opts.base_score;
		
		fillBoard();
		
		cb();
	}
	
	/**
	 * Generates random jewel 
	 *
	 * @private
	 * @method randomJewel
	 * @param {Array} Exclude jewels from generator
	 * @returns Integer Random jewel
	 */	
	function randomJewel() {
		var lookfor = (arguments.length) ? '(' + Array.prototype.join.call(arguments, ')|(') + ')' : -1; 
		var randomizer = jewel_types.replace(new RegExp(lookfor, 'g'), '');
		
		return randomizer[Math.floor(Math.random() * randomizer.length)];
	}
	
	
	function testChain(x, y) {
		var type = getJewel(x, y);
			left = 0,
			right = 0,
			up = 0,
			down = 0;
			
		while (type === getJewel(x - left - 1, y)) 
			left++;
		
		while (type === getJewel(x + right + 1, y)) 
			right++;

		while (type === getJewel(x, y - up - 1)) 
			up++;

		while (type === getJewel(x, y + down + 1)) 
			down++;
						//horizontal, vertical
		return Math.max(right + left + 1, up + down + 1);
	}
	
	
	function isAdjacent(j1, j2) {
		return (Math.abs(j1.x - j2.x) + Math.abs(j1.y - j2.y) === 1); 
	}
	
	
	function canSwap(j1, j2) {
		if (!isAdjacent(j1, j2))
			return false;
		
		var type1 = getJewel(j1.x, j1.y);
		var type2 = getJewel(j2.x, j2.y);
		
		board[j1.x][j1.y] = type2;
		board[j2.x][j2.y] = type1;

		var chain = (testChain(j1.x, j1.y) > 2 || testChain(j2.x, j2.y) > 2);

		board[j1.x][j1.y] = type1;
		board[j2.x][j2.y] = type2;

		return chain;
	}
	
	//get all available chains
	function getChains() {
		var chains = [];
		
		for(var i = 0; i < rows; i++) {
			chains[i] = [];
			for(var j = 0; j < cols; j++) 
				chains[i][j] = testChain(i, j);
		}	
		
		return chains;
	}
	
	
	function calcChainScore(num) {
		return base_score * Math.pow(2, num - 3);
	}
	
	
	function canJewelMove(i, j) {
		return 	  ((i > 0 && canSwap( {x:i, y:j}, {x:i - 1, y: j} )) 
				|| (i < rows && canSwap( {x:i, y:j}, {x:i + 1, y: j} )) 
				|| (j > 0 && canSwap( {x:i, y:j}, {x: i, y: j - 1} )) 
				|| (j < cols && canSwap( {x:i, y:j}, {x:i, y: j + 1} )));
	}
	
	
	function hasMoves() {
		for(var i = 0; i<rows; i++)
			for(var j = 0; j<cols; j++) 
				return canJewelMove(i, j);
	}
	
	
	function check(events) {
		var chains = getChains(),
			score = 0, had_chains = false, moved = [], removed = [], gaps = [];
		
		for(var i = rows - 1; i >= 0; i--) {
			gaps[i] = 0;
			for(var j = 0; j < cols; j++) {
				if (chains[i][j] > 2) {
					had_chains = true;
					gaps[i]++;
					removed.push({
						x: i,
						y: j,
						type: getJewel(i, j)
					});
					
					score += calcChainScore(chains[i][j]); 
				} else if (gaps[i] > 0) {
					moved.push({
						toX: i + gaps[i],
						toY: j,
						fromX: i,
						fromY: j,
						type: getJewel(i, j) 	
					});
					board[i + gaps[i]][j] = getJewel(i, j); 
				}
			}
			//add jewels to gaps
			for(j = 0; j < gaps[i]; j++) {
				board[i][j] = randomJewel();
				moved.push({
					toX: i,
					toY: j,
					fromX: i,
					fromY: j - gaps[i],
					type: board[i][j] 	
				});				
			}	
		}
		
		events = events || [];
		if (had_chains) {
			//events sorted chronologically
			events.push({
				type: 'remove',
				data: removed
			},{
				type: 'score',
				data: score
			},{
				type: 'move',
				data: moved
			});
			
			if (!hasMoves()) {
				fillBoard();
				events.push({
					type: 'refill',
					data: getBoard()
				});
			}
			
			return check(events);
		} else
			return events;
	}
	
	
	function getBoard() {
		var copy = [];
		for(var i = 0; i< rows; i++)
			copy[i] = board[i].slice(0);
		
		return copy;
	}
	
	
	function doSwap(j1, j2, cb) {
		var tmp, 
			events;
		
		if (canSwap(j1, j2)) {
			tmp = getJewel(j1.x, j1.y);
			board[j1.x][j1.y] = getJewel(j2.x, j2.y);
			board[j2.x][j2.y] = tmp;

			events = check();
			cb(events);
		} else
			cb(false);
	}
	
	
	function fillBoard() {
		var type;
		for(var i = 0; i < rows; i++) {
			board[i] = [];
			for(var j = 0; j < cols; j++) 
				board[i].push(randomJewel( getJewel(i - 2,j), getJewel(i, j - 2) ));
		}	
		
		if (!hasMoves())
			fillBoard();
	}
	
	
	function getJewel(i, j) {
		return (i < 0 || i > cols - 1 || j < 0 || j > rows - 1) ? -1 :  board[i][j];
	}
	
	
	function print() {
		var str = '';
		for(var i = 0; i < rows; i++) {
			for(var j = 0; j < cols; j++)
				str += getJewel(j, i) + ' ';
			str += '\r\n';
		}	
		
		console.log(str);
	}
	
	
	
	return {
		init: init,
		print: print,
		canSwap: canSwap,
		doSwap: doSwap,
		getBoard: getBoard
	};
})();