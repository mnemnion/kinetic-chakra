(function(){
var stage = new Kinetic.Stage({
    container: 'container',
    width: 640,
    height: 640,
});

var boardLayer = new Kinetic.Layer();
var backgroundLayer = new Kinetic.Layer();
var targetLayer = new Kinetic.Layer();
var pieceLayer = new Kinetic.Layer();

// outerEdge defines the outer edge of the board
var outerEdge = new Kinetic.Circle({ 
  x: stage.getHeight() / 2,
  y: stage.getHeight() / 2,
  radius: stage.getHeight()/2 - 0.1*stage.getHeight()/2,
  fill: 'none',
  stroke: 'none',
  strokeWidth: 4
});

var chakraRadius = outerEdge.getRadius()/2;

// Game Logic

function cycleTwelve(value, addend) {
  // may I protest a moment and say
  // that this is what %
  // is supposed to do
  // in a math-respecting language
  if (value <= 11 && value >= 0) {
    if (addend >= 0) {
      return((value+addend)%12)
    } else if (-12 <= addend) {
      result = value + addend; //remember in this case addend is negative.
      if (result < 0) {
        return (12+result);
      } else {
        return result;
      }
    } 
  } 
}

var gameState = {
  isBlackMove: true,
  isSliding: false,
  blackCaptures: 0,
  whiteCaptures: 0
};

gameState.board = new Array(6);

for (var n=0; n < 7; n++) {
  gameState.board[n] = new Array(12);
  for (var m=0; m < 12; m++) {
    gameState.board[n][m] = 'none';
  } 
};


gameState.getAdjacent = function(level, row) {
  var adjacencies = Array();
  switch(level) {
    case 0:
      console.log("it's the inner circle");
      break;
    case 1:  
    case 2:
    case 3:
    case 4:
      console.log("one of the middle circles");
      adjacencies[0] = {
        circleLevel: level+1,
        circleRow: cycleTwelve(row, -1)
      };
      adjacencies[1] = {
        circleLevel: level +1,
        circleRow: row
      };
      adjacencies[2] = {
        circleLevel: level -1,
        circleRow: cycleTwelve(row,+1)
      };
      adjacencies[3] = {
        circleLevel: level -1,
        circleRow: row
      }
      break;
    case 5:
      console.log("the outer rim!");
      break;
    default:
      console.log("this shouldn't happen");
  }
  return adjacencies;
};


gameState.getGroup = function(circleLevel, circleRow) {

};

gameState.getSlideable = function(circleLevel, circleRow) {
  // return all points this piece can slide to.

};

gameState.countLiberties = function(circleGroup) {

};

gameState.isDead = function(circleGroup) {

};

gameState.calculateWin = function() {

};

// End Game Logic

// View Logic

// View functions

var chakraRing = new Array();
var pieceArray = new Array();

function addPiece (that, type) {
  (function() {
    
    var newPiece = new Kinetic.Circle ({
      x: that.getX(),
      y: that.getY(),
      radius: chakraRadius/8,
      fill: type,
      listening: false
    });
    newPiece.circleRow = that.circleRow;
    newPiece.circleLevel  = that.circleLevel;
    gameState.board[newPiece.circleLevel][newPiece.circleRow] = newPiece.getFill();
    pieceArray.push(newPiece);
    pieceLayer.add(newPiece);
    pieceLayer.draw();
  })(); 
}





// populate chakraRing group with circles.
(function() {
  for (var n=0; n<12; n++) {
    var i = n;
    var color = '';
    if (i%2===0){
        color = 'black';
    } else {
        color = 'maroon';
    };

    var circle = new Kinetic.Circle({
      x: stage.getHeight() / 2 + chakraRadius*Math.cos(2*Math.PI*i/12),
      y: stage.getHeight() / 2 + chakraRadius*Math.sin(2*Math.PI*i/12),
      radius: chakraRadius,
      fill: 'none',
      stroke: color,
      strokeWidth: 4
    });

 //   console.log("creating ring " + i);
    chakraRing[i]=circle;
};
  }());

var targetCircles = new Array();

//populate the targetCircles array with special targetCircles
(function(){
  for (n=1; n<7; n++) {
    var ring = Array();
    ringRadius = chakraRadius * Math.sin(2*Math.PI*n/24); // formula of a chord
    for (m=0; m<12; m++) { 

        var circle = new Kinetic.Circle({
          x : stage.getHeight() / 2 + 2*ringRadius*Math.cos(2*Math.PI*(m+n/2)/12),
          y : stage.getHeight() / 2 + 2*ringRadius*Math.sin(2*Math.PI*(m+n/2)/12),
          radius : chakraRadius/8
        });
        circle.circleLevel = n-1;
        circle.circleRow = m;

        circle.on('click', function(evt){
          if (gameState.board[this.circleLevel][this.circleRow] === 'none') {
            if (!gameState.isSliding) {
              if (gameState.isBlackMove) {
                addPiece(this, 'black');
                gameState.isBlackMove = false;
              } else {
                addPiece(this, 'white');
                gameState.isBlackMove = true;
              }
              console.log(this.circleLevel + ' sub ' + this.circleRow + ' is now ' + gameState.board[this.circleLevel][this.circleRow]);
              targetLayer.draw();
            }
          }
        });

        circle.on('mouseover', function(evt){
          this.setStroke('green');
          this.setStrokeWidth(3);
          targetLayer.draw();
        });

        circle.on('mouseleave', function(evt){
          this.setStroke('none');
          targetLayer.draw();
        });

        circle.on('dblclick', function(evt){
          var buddies = gameState.getAdjacent(this.circleLevel,this.circleRow);
          console.log(buddies);
          for (i = 0; i < buddies.length; i++) {
            targetCircles[buddies[i].circleLevel][buddies[i].circleRow].setFill('lightgreen');
          }
          targetLayer.draw();
        })
  
        ring.push(circle);
    }
  targetCircles.push(ring);
}
}());

var border = new Kinetic.Rect({
  x: 4,
  y: 4,
  width: stage.getWidth()-6,
  height: stage.getHeight()-6,
  stroke: 'black',
  fill: '#999999',
  strokeWidth: 4
})

// add the layers up
for (n=0; n<chakraRing.length; n++) {
  boardLayer.add(chakraRing[n]);  
}

backgroundLayer.add(border);

for (n=0; n<targetCircles.length;n++) {
  for (m=0; m<targetCircles[n].length; m++) {
//    console.log("adding targetCircles " + n + " sub " + m);
    targetLayer.add(targetCircles[n][m]);
  }
}

// add the layers to the stage
stage.add(backgroundLayer);
stage.add(boardLayer);
stage.add(targetLayer);
stage.add(pieceLayer);
console.log("ready");

}());