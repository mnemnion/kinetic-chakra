//(function(){ 
var gameStage = new Kinetic.Stage({
		container: 'container',
		width: 860,
		height: 640,
});

var gameState = {
	numCircles: 12,
	whichMove: 'black',
	isSliding: false,
	sliderSelected: false,
	blackCaptures: 0,
	whiteCaptures: 0,
	pieceIDs: 0,
	showChakras: false,
	showGroups: false,
	showSliding: false
};

var localState = {
	isMyMove: true,
	isLocalGame: true,
	myColor: 'black'
}

var chakraGamesRef = new Firebase('https://chakra.firebaseIO.com/games/');

var gameBase = chakraGamesRef.push();
var moveBase = gameBase.child('moves');

var moveArray = [];


gameStateNextTurn = function() {
	if (gameState.whichMove === 'black') {
		gameState.whichMove = 'white';
	} else {
		gameState.whichMove = 'black';
	}
	flipWhiteBlack();
	gameState.isSliding = false;
	gameState.sliderSelected = false;
	for (i=0; i < 6; i++) {
		for(j=0; j < gameState.numCircles; j++) {
			slideArray[i][j] = 'mt';
			targetArray[i][j].setStroke('none');
		}
	}
	gameBase.update({gameState: gameState});
	targetLayer.draw();
	console.log('next turn');
}

gameStatePieceAdded = function(piece) {
	gameState.isSliding = true;
	gameBase.set({gameState: gameState});
	moveArray.push({
		type: 'add',
		color: piece.getFill(),
		level: piece.level,
		row: piece.row
	});
	moveBase.set(moveArray);
	console.log('piece added');
}

var boardLayer = new Kinetic.Layer();
var backgroundLayer = new Kinetic.Layer();
var targetLayer = new Kinetic.Layer();
var pieceLayer = new Kinetic.Layer();
var slideLayer = new Kinetic.Layer();

// outerEdge defines the outer edge of the board
var outerEdge = new Kinetic.Circle({ 
	x: gameStage.getHeight(),// gameStage.getHeight() / 2,
	y: gameStage.getHeight(),// gameStage.getHeight() / 2,
	radius: gameStage.getHeight()/2 - 0.1*gameStage.getHeight()/2,
	fill: 'none',
	stroke: 'none',
	strokeWidth: 4,
	offset: [gameStage.getHeight()/2,gameStage.getHeight()/2]
});

var chakraRadius = outerEdge.getRadius()/2;

//these hold pieces and slide targets as necessary
var pieceArray = new Array();
var slideArray = new Array();
for (i=0; i < 6; i++) {
	pieceArray[i] = new Array();
	slideArray[i] = new Array();
	for(j=0; j < gameState.numCircles; j++) {
		pieceArray[i].push('mt');
		slideArray[i].push('mt');
	}
}

// Game Logic

function cycleNumCircles(value, addend) {
 
	/* BETTER WAY TO DO IT

			return ((this%n)+n)%n;

			keeping the worse way b/c bounds checking

	*/


	if (value <= gameState.numCircles -1 && value >= 0) {
		if (addend >= 0) {
			return((value+addend)%gameState.numCircles)
		} else if (-gameState.numCircles <= addend) {
			result = value + addend; // remember in this case addend is negative.
			if (result < 0) {
				return (gameState.numCircles+result);
			} else {
				return result;
			}
		} 
	} 
}




getAdjacent = function(level, row, circleArray) {
	var adjacencies = Array()
	switch(level) {
		case 0:
			adjacencies[0] = circleArray[level+1][cycleNumCircles(row, -1)];
			adjacencies[1] = circleArray[level+1][row];
			adjacencies[2] = circleArray[level][cycleNumCircles(row, +5)];
			adjacencies[3] = circleArray[level][cycleNumCircles(row, +7)];
			break;
		case 1:  
		case 2:
		case 3:
		case 4:
			adjacencies[0] = circleArray[level+1][cycleNumCircles(row, -1)];
			adjacencies[1] = circleArray[level+1][row];
			adjacencies[2] = circleArray[level-1][cycleNumCircles(row, +1)];
			adjacencies[3] = circleArray[level-1][row];   
			break;
		case 5:
			adjacencies[0] = circleArray[level][cycleNumCircles(row, -1)];
			adjacencies[1] = circleArray[level][cycleNumCircles(row, +1)];
			adjacencies[2] = circleArray[level-1][row];
			adjacencies[3] = circleArray[level-1][cycleNumCircles(row,+1)];
			break;
		default:
			console.log("this shouldn't happen");
	}
	return adjacencies;
};

getAdjacentPieces = function(piece) {

	var buddies = getAdjacent(piece.level, piece.row, pieceArray);
	var pieces = Array();
	for (var i=0; i<buddies.length;i++) {
		if (buddies[i]!=='mt') {
			pieces.push(buddies[i]);
		}
	}
	return pieces;
};

getAdjacentLiberties = function(piece) { // takes a piece
	var buddies = getAdjacent(piece.level, piece.row, targetArray);
	var emptyTargets = Array();
	for (var i=0; i<buddies.length;i++) {
		if (pieceArray[buddies[i].level][buddies[i].row]==='mt') {
			emptyTargets.push(buddies[i]);
		}
	}
	return emptyTargets; // returns TARGETS
};


getAdjacentTargets = function(piece) {
	var targets = getAdjacent(piece.level, piece.row, targetArray);
	return targets;
};


var getGroup = function (piece, group, color) {
	if (group === undefined) {
		var group = Array();
	} // create our container if we're at the top of the descent path
	if (color === undefined) {
		var color = piece.getFill();
	}
	if (color === piece.getFill()) {
		group.push(piece); // add the piece in question.
		var buddies = getAdjacentPieces(piece); // get all friends
		for (var i=0; i<buddies.length;i++) {
			var notInGroup = true;
			for (var j=0; j<group.length;j++) {
				if (buddies[i] === group[j]) {
					notInGroup = false;
				}
			}
			if (notInGroup === true) {
				getGroup(buddies[i],group,color);
			}
		} 
	}
	return group;
};

var getEmptyGroup = function (target, group) {
	if (group === undefined) {
		var group = [[],[],[]];
	} // create our container if we're at the top of the descent path
	if (pieceArray[target.level][target.row] === 'mt') {
		group[0].push(target); // add the target in question.
		var buddies = getAdjacentTargets(target);
		for (var i=0; i<buddies.length;i++) {
			var notInGroup = true;
			for (var j=0; j<group[0].length;j++) {
				if (buddies[i] === group[0][j]) {
					notInGroup = false;
				}
			}
			if (notInGroup === true) {
				getEmptyGroup(buddies[i],group);
			}
		} 
	} 

	else if (pieceArray[target.level][target.row].getFill() === 'black') {
		var notInGroup = true;
		for (var i=0; i<group[1].length; i++) {
			if (pieceArray[target.level][target.row] === group[1][i]) {
				notInGroup = false;
			}
		}
		if (notInGroup) {
			group[1].push(pieceArray[target.level][target.row]);
		}
	}
	else if (pieceArray[target.level][target.row].getFill() === 'white') {
		var notInGroup = true;
		for (var i=0; i<group[2].length; i++) {
			if (pieceArray[target.level][target.row] === group[2][i]) {
				notInGroup = false;
			}
		}
		if (notInGroup) {
			group[2].push(pieceArray[target.level][target.row]);
		}
	}
	return group;
};

var cycleArray = function(toBeCycled, index, numTimes) {
	// cycles upwards through array toBeCycled, starting at index, numTimes.
	var catcher = Array();
	var cycler = index;
	if (index >= toBeCycled.length) {
		console.log ('index out of bounds in cycle Array');
		return;
	}
	for (i=0; i<numTimes; i++) {
		catcher[i] = toBeCycled[cycler];
		cycler++;
		if (cycler === toBeCycled.length) {
			cycler = 0;
		}
	}
	return catcher;
};

console.log(cycleArray([1,2,3],1,gameState.numCircles -1));

getChakras = function(piece) {
	// returns all points on both chakras the piece is on.
	var clockwiseCircle = [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[4,1],[3,2],[2,3],[1,4],[0,5]];
	var counterclockwiseCircle = [[0,0],[1,11],[2,10],[3,9],[4,8],[5,7],[4,7],[3,7],[2,7],[1,7],[0,7]];
	var myClockwise = cycleArray (clockwiseCircle, piece.level, 11);
	var myCounterclockwise = cycleArray(counterclockwiseCircle, piece.level, 11);
	if (piece.level === 5) {
		//handle the outer ring exception
		for (i = 0; i < 12; i++) {
			myCounterclockwise[i] = [5, cycleNumCircles(i,piece.row+1)];
		}
		myCounterclockwise.reverse();
		console.log("Outer ring myCounterclockwise");
		console.log(myCounterclockwise);
	} else {
		for (i = 0; i < myCounterclockwise.length; i++) {
			myCounterclockwise[i] = [myCounterclockwise[i][0],cycleNumCircles(myCounterclockwise[i][1],piece.level)];
		}
	}
	var chakras = [[],[]];
	for (i=0; i<myClockwise.length; i++) {
		chakras[0][i] = targetArray[myClockwise[i][0]][cycleNumCircles(myClockwise[i][1],piece.row)];  
	}
	for (i=0; i<myCounterclockwise.length; i++) {
		if (piece.level === 5) {   
			chakras[1][i] = targetArray[myCounterclockwise[i][0]][myCounterclockwise[i][1]];
		} else {
			chakras[1][i] = targetArray[myCounterclockwise[i][0]][cycleNumCircles(myCounterclockwise[i][1],piece.row)];
		}
	}
	if (piece.level ===5) {
		console.log("returning chakras:");
		console.log(chakras);
	}
	return chakras;
};

getSlideable = function(piece) {
	// return all points this piece can slide to.
	var chakras = getChakras(piece);
	var slideable = Array();
	for (i = 0; i<=1; i++){
		for (j=1; j<chakras[i].length; j++) {
			var thisPiece = pieceArray[chakras[i][j].level][chakras[i][j].row];
			if (thisPiece==='mt') {
				slideable.push(chakras[i][j]);
			} else {
				break;
			}
		}
		for(j=chakras[i].length-1; j>=1; j--) {
			var thisPiece = pieceArray[chakras[i][j].level][chakras[i][j].row];
			if (thisPiece==='mt') {
				slideable.push(chakras[i][j]);
			} else {
				break;
			}
		}
	}
	return slideable; // array of targetCircles
};

countLiberties = function(group) {
	var libArray = Array();
	for (var i=0; i<group.length; i++) {
		adjacencies = getAdjacentLiberties(group[i]);
		for (var j=0; j<adjacencies.length; j++) {
			var notInGroup = true;
			for (var m=0; m<libArray.length;m++) {
				if (libArray[m] === adjacencies[j]) {
					notInGroup = false;
				}
			}
			if (notInGroup) {
				libArray.push(adjacencies[j]);
			}
		}
	}
	if (libArray.length >=1) {
			return libArray.length
		} else {
			return 0;
		}
};

killGroup = function(enemyGroup) {
	console.log("Bang! You're dead");
	var killMove = {
		type: 'kill',
		color: enemyGroup[0].getFill(),
		pieces: []
	};

	if(enemyGroup[0].getFill()==='black'){
		gameState.whiteCaptures += enemyGroup.length;
		console.log("White has captured " + gameState.whiteCaptures + " stones so far");
	} else {
		gameState.blackCaptures += enemyGroup.length;
		console.log("Black has captured " + gameState.blackCaptures + " stones so far");
	}
		gameBase.update({gameState: gameState});
		console.log("destroying:");
		console.log(enemyGroup);
	for (i=0; i<enemyGroup.length; i++) {
		var deadPiece = {
			level: enemyGroup[i].level,
			row: enemyGroup[i].row, 
		}
		killMove.pieces.push(deadPiece);
		pieceArray[enemyGroup[i].level][enemyGroup[i].row] = 'mt';
		enemyGroup[i].setFill('none');
	}
	pieceLayer.draw();
	moveArray.push(killMove);
	moveBase.set(moveArray);
}

var removePiece = function(piece){
	pieceArray[piece.level][piece.row] = 'mt';
	piece.setFill('none');
	gameState.isSliding = false;
	gameBase.update({gameState: gameState}); 
	pieceLayer.draw();
}

removeBogusPiece = function(piece) {
	removePiece(piece);
	moveArray.pop();
	moveBase.set(moveArray);
	
}

emanateKill = function(piece) {
	touching = getAdjacentPieces(piece);
	for (var i=0; i<touching.length; i++) {
		if (touching[i].getFill() !== piece.getFill()) {
			enemyGroup = getGroup(touching[i]);
			atari = countLiberties(enemyGroup);
			if (atari===0) {
				killGroup(enemyGroup);
			}
		}
	}

};

function addPiece (that, type) {
		var newPiece = new Kinetic.Circle ({
			x: that.getX(),
			y: that.getY(),
			radius: chakraRadius/8,
			fill: type,
			listening: false,
			id: gameState.pieceIDs
		});
		gameState.pieceIDs++;
		newPiece.row = that.row;
		newPiece.level  = that.level;
		pieceArray[that.level][that.row] = newPiece;
		pieceLayer.add(newPiece);
		gameStatePieceAdded(newPiece);
		emanateKill(newPiece);
		 // check for four surrounding enemies
		noAtari = getGroup(newPiece);
		var isOk = true;
		numLiberties = countLiberties(noAtari);
		if (numLiberties === 0) {
			removeBogusPiece(newPiece);  
		} 
		pieceLayer.draw();
};

slidePiece = function(piece, targetCircle) {
	// this function contains trigonometric voodoo. 
	// it is made inordinately complex because:
	// a) there are always two circles the piece could be moving on
	// b) it may need to move in either direction on either circle
	// c) one of the circles may be a special case
	// d) the nature of kinetic/canvas coordinates is such that, to
	//	  allow an object to rotate on its center, you must place it too
	//    far by exactly half the length/width and then offset it back to
	//	  where you want it 
	// e) a 'circle' is not a natural data type in JavaScript, and even if it was,
	//    the way we keep track of positions does not make it obvious where on a given
	//	  chakra a piece is located. More precisely, you always know one chakra a piece is on,
	//    and can derive the other from the level through subtraction (or simple observation that
	//    the level is the outermost one).

	var chakras = getChakras(piece);
	var slideable = Array();
	var onClockwise = true;
	var goingUp =true;
	var direction = Array();
	var slideGroup = new Kinetic.Group();
	var found = false;

	var slideCallback = function() {
		slideGroup.remove();
		// make murder if called for
		emanateKill(piece);
		piece.setX(targetCircle.getX());
		piece.setY(targetCircle.getY());
		pieceLayer.add(piece);
		pieceLayer.draw();
		gameStateNextTurn();
	}
	
	// find out on which chakra is the target, in which direction
	for (i = 0; i<=1; i++){
		if (found) {break};
		var innerRadius = 0;
		goingUp = true;
		for (j=1; j<chakras[i].length; j++) {
			var thisPiece = pieceArray[chakras[i][j].level][chakras[i][j].row];
			if (chakras[i][j].level === chakras[i][j-1].level) {
				innerRadius+=1; // accounting for the middle point
			}
			if (chakras[i][j] === targetCircle) {
				innerRadius = innerRadius + j;
				direction.push(onClockwise);
				direction.push(goingUp);
				found = true; 
				break;
			} else if (thisPiece !== 'mt') {
				console.log(thisPiece);
				break;
			}
		}
		if (found) {
			break;
		} 
		innerRadius = 0;
		goingUp = false;
		for(j=chakras[i].length-1; j>=1; j--) {
			var thisPiece = pieceArray[chakras[i][j].level][chakras[i][j].row];
		
			if (chakras[i][j].level === chakras[i][(j+1)%chakras[i].length].level) { //'remainder' ok as both inputs are positive
				innerRadius+=1; // accounting for the middle point
			}
			if (chakras[i][j] === targetCircle) {
				direction.push(onClockwise);
				direction.push(goingUp);
				innerRadius = innerRadius+(11-j);
				found = true;
				break;
			} else if (thisPiece !== 'mt') {
				console.log(thisPiece);
				break;
			}
		}
		onClockwise = !onClockwise;
	}

	if (piece.level === 5 && !direction[0]) { //outer ring
		piece.remove();
		slideGroup.add(piece);
		slideGroup.setX(outerEdge.getX()/2);
		slideGroup.setY(outerEdge.getY()/2);
		slideGroup.setOffset(outerEdge.getOffset());
		slideLayer.add(slideGroup);
		if (direction[1]) {
			radian = -2*Math.PI*cycleNumCircles(piece.row,-targetCircle.row)/gameState.numCircles;
		} else {
			radian = 2*Math.PI*cycleNumCircles(targetCircle.row, -piece.row)/gameState.numCircles;
		}
		console.log("moving " + piece.level + " sub " + piece.row + " to " + targetCircle.level + " sub " + targetCircle.row);
		slideGroup.transitionTo({
			rotation: radian,
			duration: 0.2*innerRadius,
			easing: 'ease-in-out',
			callback: slideCallback	
		});
	} else { // we are on one of the inner rings
				//clockwise circle, chakra[0]
				var chakraNum;
				if (direction[0]){
					for (i=0;i<chakras[0].length; i++) {
						if (chakras[0][i].level === 5) {
							chakraNum = chakras[0][i].row // chakra index is the row at maximum
							break;
						}
					}
				} else {
					for (i=0;i<chakras[1].length; i++) {
						if (chakras[1][i].level === 5) {
							chakraNum = chakras[1][i].row // chakra index is the row at maximum
							break;
						}
					}
				}
				chakraNum = cycleNumCircles(chakraNum, -1);
				piece.remove();
				slideGroup.add(piece);
				slideGroup.setX(chakraRing[chakraNum].getX()/2);
				slideGroup.setY(chakraRing[chakraNum].getY()/2);
				slideLayer.add(slideGroup);
				slideGroup.setOffset(chakraRing[chakraNum].getOffset());
				if(direction[1] && !direction[0]) {
					radian = -2*Math.PI*innerRadius/gameState.numCircles;
				} else if (direction[1] && direction[0]) {
					radian = 2*Math.PI*innerRadius/gameState.numCircles;
				} else if (!direction[1] && direction[0]) {
					radian = -2*Math.PI*innerRadius/gameState.numCircles;
				} else {
					radian = 2*Math.PI*innerRadius/gameState.numCircles;;
				}
				console.log("moving " + piece.level + " sub " + piece.row + " to " + targetCircle.level + " sub " + targetCircle.row);
				slideGroup.transitionTo({
					rotation: radian,
					duration: 0.3*innerRadius,
					easing: 'ease-in-out',
					callback: slideCallback
				});
		}
	return piece;
};

movePiece = function (piece, targetCircle) {
	if (pieceArray[targetCircle.level][targetCircle.row] === 'mt') {
		console.log('moving piece to ' + targetCircle.level + " sub " + targetCircle.row);
		pieceArray[targetCircle.level][targetCircle.row] = piece;
		//piece is in the array but doesn't know it
		pieceArray[piece.level][piece.row] = 'mt';
		//now we move it
		for (i=0; i < 6; i++) {
			for(j=0; j < gameState.numCircles; j++) {
				//slideArray[i][j] = 'mt';
				targetArray[i][j].setStroke('none');
			}
		}
		targetLayer.draw();
		piece = slidePiece(piece, targetCircle);
		//tell the FireBase about it
		moveArray.push({
			type: 'slide',
			color: piece.getFill(),
			oldLevel: piece.level,
			oldRow: piece.row,
			newLevel: targetCircle.level,
			newRow: targetCircle.row,
			
		});
		moveBase.set(moveArray);
		//then tell it where it is
		piece.level = targetCircle.level;
		piece.row = targetCircle.row;		
	} else {
		console.log("cannot move piece to occupied zone");
	}
	pieceLayer.draw();
	// nb: slidePiece has a callback so stuff happens after movePiece returns. 
}

calculateWin = function() {
	// start with number of captures
	var blackScore = gameState.blackCaptures;
	var whiteScore = gameState.whiteCaptures;

	// get all empty groups
	// first get all empty spaces
	var empties = Array();
	var groups = Array();
	for (var i=0; i<targetArray.length; i++) {
		for (var j=0; j<targetArray[i].length; j++) {
			if (pieceArray[i][j] === 'mt') {
				empties.push(targetArray[i][j]);
				empties[empties.length-1].grouped = false;
			}
		}
	}
	console.log(empties);
	// take each empty space, get the group it's in
	for (i=0; i<empties.length; i++) {
		if(!empties[i].grouped) {
			groups.push(getEmptyGroup(empties[i]));
			for (j=0; j<groups[groups.length-1][0].length; j++) {
				// subtract all empty spaces in that group from consideration
				for (var m=0; m<empties.length; m++) {
					if (groups[groups.length-1][0][j] === empties[m]) {
						empties[m].grouped = true;
					}
				}
			}
		}
	}
	console.log(groups);
	// remove the grouped property entirely 
	for (var i=0; i<targetArray.length; i++) {
		for (var j=0; j<targetArray[i].length; j++) {
			delete targetArray[i][j].grouped;
		}
	}
	
	// determine which ones are territory and add to total
	for (var i=0; i< groups.length; i++) {
		if (groups[i][1].length>1 && groups[i][2].length===0) { //black group
			blackScore += groups[i][0].length;
		} else if (groups[i][2].length>1 && groups[i][1].length ===0 ) {
			whiteScore += groups[i][0].length;
		}
	}
	console.log("black score is: " + blackScore);
	console.log("white score is: " + whiteScore);
	alert("Black Score is: " + blackScore + '\n' + "White Score is: " + whiteScore);
	// bob's your uncle

};

var undoMove = function() { // hooo boy
	// undoMove presumes you have permission. 
	// that is, it does not care it if was 'your'
	// move. it will remove it. 
	var latestMove = moveArray.pop();
	console.log('latest move is:');
	console.log(latestMove);
	switch (latestMove.type) {
		case 'add':
			if (latestMove.color === pieceArray[latestMove.level][latestMove.row].getFill()) {
				// remove piece
				removePiece(pieceArray[latestMove.level][latestMove.row]);

			} else {
				console.log("attempt to undo added piece has barfed");
			}
			break;
		case 'slide':
			if (latestMove.color === pieceArray[latestMove.level][latestMove.row]) {
				// put it back where it belongs, complete with fancy transition
			} else {
				console.log("attempt to slide added piece is unhappy");
			}
			break;
		case 'kill':
			// unkill the whole group, and then unmove the prior move, because whatever it was,
			// it's what killed the piece in question. 
			break;

	}
	moveBase.set(moveArray);

}
// End Game Logic

// View Logic

// View functions



var flipWhiteBlack =(function() {
	var whiteCircle = new Kinetic.Circle ({
		x: gameStage.getWidth()*4/5 + 75 - chakraRadius/8,
		y: gameStage.getHeight() * 1/7,
		radius: chakraRadius/4,
		fill: 'white'
	})
	var blackCircle = new Kinetic.Circle ({
		x: whiteCircle.getX() + chakraRadius/4,
		y: whiteCircle.getY(), 
		radius: whiteCircle.getRadius(),
		fill: 'black'
	})
	targetLayer.add(whiteCircle);
	targetLayer.add(blackCircle);
	blackCircle.moveToTop();
	targetLayer.draw;
	var flipIt = function() {
		if (gameState.whichMove === 'black') {
			blackCircle.moveToTop();
		} else {
			whiteCircle.moveToTop();
		}
	}
	return flipIt;
}());


var clickPass = (function() {
	var passButton = new Kinetic.Rect ({
		x: gameStage.getWidth()*4/5,
		y: gameStage.getHeight()*2/5,
		cornerRadius: 6,
		height: 50,
		width: 150,
		fill: 'maroon',
		stroke: 'black',
		strokeWidth: 2,
		shadowOffset: 4,
		shadowBlur: 5,
		shadowOpacity: 0.5
	})
	var flashButton = new Kinetic.Rect({
		x: passButton.getX(),
		y: passButton.getY(),
		cornerRadius: passButton.getCornerRadius(),
		height: passButton.getHeight(),
		width: passButton.getWidth(),
		fill: 'red',
		opacity: 0
	})
	var buttonText = new Kinetic.Text ({
		x: passButton.getX(),
		y: passButton.getY()+9,
		text: "Pass",
		fontSize: 30,
		fontFamily: 'Calibri',
		fill: 'black',
		width: passButton.getWidth(),
		align: 'center',
		listening: false
	})

	flashButton.on('click', function(evt){
		
		moveArray.push({
			type: 'pass',
			color: gameState.whichMove
		});
		moveBase.set(moveArray);
		gameStateNextTurn();
		flashButton.transitionTo({
			opacity: 1,
			duration: 0.25,
			callback: function() {flashButton.transitionTo({
				opacity: 0,
				duration: 0.25
			})}
		})
	});
	var clickThis = function(){
		flashButton.simulate('click');
	}

	targetLayer.add(passButton);
	targetLayer.add(flashButton);
	targetLayer.add(buttonText);
	targetLayer.draw();
	return clickThis;
}());

(function() {
	var undoButton = new Kinetic.Rect ({
		x: gameStage.getWidth()*4/5,
		y: gameStage.getHeight()*3/5,
		cornerRadius: 6,
		height: 50,
		width: 150,
		fill: 'darkgreen',
		stroke: 'black',
		strokeWidth: 2
	})

	if (gameState.showGroups) {
		undoButton.setFill('lightgreen');
	}

	undoButton.on('click', function(evt){
		undoMove();
		targetLayer.draw();
	});

	targetLayer.add(undoButton);
	targetLayer.draw();
}());

var chakraRing = new Array();
// populate chakraRing group with circles.
(function() {
	for (var n=0; n<gameState.numCircles; n++) {
		var i = n;
		var color = '';
		if (i%2===0){
				color = 'black';
		} else {
				color = 'maroon';
		};

		var circle = new Kinetic.Circle({
			x: 2*(gameStage.getHeight() / 2 + chakraRadius*Math.sin(2*Math.PI*i/gameState.numCircles)),
			y: 2*(gameStage.getHeight() / 2 + chakraRadius*Math.cos(2*Math.PI*i/gameState.numCircles)),
			radius: chakraRadius,
			fill: 'none',
			stroke: color,
			strokeWidth: 4,
			offset: [gameStage.getHeight() / 2 + chakraRadius*Math.sin(2*Math.PI*i/gameState.numCircles),
						gameStage.getHeight() / 2 + chakraRadius*Math.cos(2*Math.PI*i/gameState.numCircles)]
		});
		chakraRing[i]=circle;
	};
		chakraRing.reverse();
	chakraRing.push(outerEdge);
}());

var targetArray = new Array();

//populate the targetArray array with special targetArray
(function(){
	for (n=1; n<7; n++) {
		var ring = Array();
		ringRadius = chakraRadius * Math.sin(2*Math.PI*n/gameState.numCircles/2); // formula of a chord
		for (m=0; m<gameState.numCircles; m++) { 

			var circle = new Kinetic.Circle({
				x : gameStage.getHeight() / 2 + 2*ringRadius*Math.cos(2*Math.PI*(m+n/2)/gameState.numCircles),
				y : gameStage.getHeight() / 2 + 2*ringRadius*Math.sin(2*Math.PI*(m+n/2)/gameState.numCircles),
				radius : chakraRadius/8,
				fill: 'none',
				stroke: 'none',
				strokeWidth: 2,
			});
			circle.level = n-1;
			circle.row = m;
		
			circle.on('click', function(evt){
				if (!gameState.isSliding) {
					if (pieceArray[this.level][this.row] === 'mt') {
						if (gameState.whichMove === 'black') {
							addPiece(this, 'black');
						} else {
							addPiece(this, 'white');
						};
						console.log(this.level + ' sub ' + this.row + ' is now ' + pieceArray[this.level][this.row].getFill());
						targetLayer.draw();
					} 
				} else if (!gameState.sliderSelected) {
						if (pieceArray[this.level][this.row] !=='mt'){
							if(pieceArray[this.level][this.row].getFill()===gameState.whichMove){
								var slideTargets = getSlideable(pieceArray[this.level][this.row]);
								gameState.slider = {
									level: this.level,
									row: this.row
								};
								gameState.sliderSelected = true;
								for (var i=0; i<slideTargets.length;i++) {
									slideTargets[i].setStroke('lightgreen');
									slideTargets[i].setStrokeWidth(3);
									slideArray[slideTargets[i].level][slideTargets[i].row] = slideTargets[i];
								}
							}
						} 
				} else if (gameState.sliderSelected) { //slider selected
					if (slideArray[this.level][this.row] !== 'mt') {
						movePiece(pieceArray[gameState.slider.level][gameState.slider.row],slideArray[this.level][this.row]);
						delete gameState['slider'];
					}
				}
				targetLayer.draw();
			});

			circle.on('mouseover', function(evt){
				if(!gameState.isSliding) {
					this.setStroke('red');
					this.setStrokeWidth(3);
				} else {
					if (pieceArray[this.level][this.row] !== 'mt' && !gameState.slideSelected) {
						if (gameState.whichMove === pieceArray[this.level][this.row].getFill()) {
							this.setStroke('red');
							this.setStrokeWidth(3);
						}
					}
				}
				if(gameState.showSliding) {
					if (pieceArray[this.level][this.row] !=='mt'){
						var slideTargets = getSlideable(pieceArray[this.level][this.row]);
						for (var i=0; i<slideTargets.length;i++) {
							if(slideTargets[i] !== undefined) {
								slideTargets[i].setStroke('lightgreen');
								slideTargets[i].setStrokeWidth(3);
							} else {
								console.log("undefined targetCircle found in getSlideable return value");
							}
						}
					}
				}
				targetLayer.draw();
			});

			circle.on('mouseleave', function(evt){
				if (!gameState.isSliding) {
					this.setStroke('none');
				} else if (!gameState.sliderSelected) {
					this.setStroke('none');
				}
				if (gameState.showSliding) {
					if (pieceArray[this.level][this.row] !=='mt'){
						var slideTargets = getSlideable(pieceArray[this.level][this.row]);
						for (var i=0; i<slideTargets.length;i++) {
							if(slideTargets[i] !== undefined) {
								slideTargets[i].setStroke('none');
								slideTargets[i].setStrokeWidth(2);
							} else {
								console.log("undefined targetCircle found in getSlideable return value");
							}
						}
					}
				}
				targetLayer.draw();
			});

			circle.on('dblclick', function(evt){
				// zen
			});

			ring.push(circle);
		}
	targetArray.push(ring);
	}
}());

var border = new Kinetic.Rect({
	x: 4,
	y: 4,
	width: gameStage.getWidth()-6,
	height: gameStage.getHeight()-6,
	stroke: 'black',
	fill: '#999999',
	strokeWidth: 4
})

// add the layers up
for (n=0; n<chakraRing.length; n++) {
	boardLayer.add(chakraRing[n]);  
}

backgroundLayer.add(border);

for (n=0; n<targetArray.length;n++) {
	for (m=0; m<targetArray[n].length; m++) {
		targetLayer.add(targetArray[n][m]);
	}
}

// add the layers to the gameStage
gameStage.add(backgroundLayer);
gameStage.add(boardLayer);
gameStage.add(targetLayer);
gameStage.add(pieceLayer);
gameStage.add(slideLayer);
// key press handlers
document.onkeypress=(function(e){
	//apparently handling keycodes directly is brittle, varying from browser to browser. rewrite. 
	if (e.keyCode === 32) {
	//	console.log("space bar pressed");
		clickPass();
	}
	if (e.keyCode === 116) { // t key
		console.log("t key pressed");
		calculateWin();
	}
});
console.log("ready");

//}());