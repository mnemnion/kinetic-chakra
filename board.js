//(function(){ 
var stage = new Kinetic.Stage({
    container: 'container',
    width: 860,
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

var pieceArray = new Array();

for (i=0; i < 6; i++) {
  pieceArray[i] = new Array();
  for(j=0; j < 12; j++) {
    pieceArray[i].push('mt');
  }
}

// Game Logic

function cycleTwelve(value, addend) {
  // may I protest a moment and say
  // that this is what %
  // is supposed to do
  // in a math-respecting language
 
  /* BETTER WAY TO DO IT
      
      This is what I get for coding around a bug that other 
      people obviously have! Also, for doing brute algorithms
      when what we want is actual math. 
      The below torturous logic, which does have the advantage of
      constraining the variables, acting as a basic sanity check,
      can be generalized as follows:

      return ((this%n)+n)%n;

  */


  if (value <= 11 && value >= 0) {
    if (addend >= 0) {
      return((value+addend)%12)
    } else if (-12 <= addend) {
      result = value + addend; // remember in this case addend is negative.
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
  whiteCaptures: 0,
  pieceIDs: 0,
  showAdjacents: false
};



getAdjacent = function(level, row, circleArray) {
  var adjacencies = Array()
  switch(level) {
    case 0:
 //     console.log("it's the inner circle");
      adjacencies[0] = circleArray[level+1][cycleTwelve(row, -1)];
      adjacencies[1] = circleArray[level+1][row];
      adjacencies[2] = circleArray[level][cycleTwelve(row, +5)];
      adjacencies[3] = circleArray[level][cycleTwelve(row, +7)];
      break;
    case 1:  
    case 2:
    case 3:
    case 4:
 //     console.log("one of the middle circles");
      adjacencies[0] = circleArray[level+1][cycleTwelve(row, -1)];
      adjacencies[1] = circleArray[level+1][row];
      adjacencies[2] = circleArray[level-1][cycleTwelve(row, +1)];
      adjacencies[3] = circleArray[level-1][row];   
      break;
    case 5:
 //     console.log("the outer rim!");
      
      adjacencies[0] = circleArray[level][cycleTwelve(row, -1)];
      adjacencies[1] = circleArray[level][cycleTwelve(row, +1)];
      adjacencies[2] = circleArray[level-1][row];
      adjacencies[3] = circleArray[level-1][cycleTwelve(row,+1)];
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

getAdjacentTargets = function(piece) {
  var targets = getAdjacent(piece.level, piece.row, targetCircles);
  return targets;
};


var getGroup = function (piece, group, color) {
  console.log(color);
  console.log(group);
  if (group === undefined) {
    var group = Array();
  } // create our container if we're at the top of the descent path
  if (color === undefined) {
    var color = piece.getFill();
    console.log("color changed to "+ color);
  }
  if (color === piece.getFill()) {
    group.push(piece); // add the piece in question.
    var buddies = getAdjacentPieces(piece); // get all friends
    console.log('buddies are:');
    console.log(buddies);
    for (var i=0; i<buddies.length;i++) {
      var notInGroup = true;
      for (var j=0; j<group.length;j++) {
        if (buddies[i] === group[j]) {
          console.log ("buddies[" + i + "] and group[" + j + "] are the same object");
          notInGroup = false;
        }
      }
      if (notInGroup === true) {
        console.log('recurse');
        getGroup(buddies[i],group,color);
      }
    } 
  }
  return group;
};

getSlideable = function(level, row) {
  // return all points this piece can slide to.

};

countLiberties = function(circleGroup) {

};

isDead = function(circleGroup) {
  // note to self: 
  // it is quite possible that groups
  // will get collected twice,
  // so we need to kill them the first time,
  // making it impossible to kill them again. 
  //
  // in particular, if a piece is placed ajacent to
  // two pieces in the same killable group, that group
  // could be collected twice. I can think of ways to avoid
  // that, which is probably the better thing to do. hmm.
};

calculateWin = function() {

};

// End Game Logic

// View Logic

// View functions

var chakraRing = new Array();

(function() {
  var inspectButton = new Kinetic.Rect ({
    x: stage.getWidth()*4/5,
    y: stage.getHeight()*1/5,
    cornerRadius: 6,
    height: 50,
    width: 150,
    fill: 'maroon',
    stroke: 'black',
    strokeWidth: 2
  })

  inspectButton.on('click', function(evt){
    if (gameState.showAdjacents === false) {
      gameState.showAdjacents = true;
      this.setFill('red');
    } else {
      gameState.showAdjacents = false;
      this.setFill('maroon');
    }
    targetLayer.draw();
  });

  targetLayer.add(inspectButton);
  targetLayer.draw();
}());



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
    pieceLayer.draw();
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
          radius : chakraRadius/8,
          fill: 'none',
          stroke: 'none',
          strokeWidth: 2,
        });
        circle.level = n-1;
        circle.row = m;

        circle.on('click', function(evt){
          if (pieceArray[this.level][this.row] === 'mt') {
            if (!gameState.isSliding) {
              if (gameState.isBlackMove) {
                addPiece(this, 'black');
                gameState.isBlackMove = false;
              } else {
                addPiece(this, 'white');
                gameState.isBlackMove = true;
              }
              console.log(this.level + ' sub ' + this.row + ' is now ' + pieceArray[this.level][this.row].getFill());
              targetLayer.draw();
            }
          }
        });

        circle.on('mouseover', function(evt){
          this.setStroke('red');
          this.setStrokeWidth(3);
          if(gameState.showAdjacents===true) {
            var buddies = getAdjacentTargets(this);
            for (var i=0; i<buddies.length; i++) {
              targetCircles[buddies[i].level][buddies[i].row].setStroke('lightgreen');
            }
          }
          targetLayer.draw();
        });

        circle.on('mouseleave', function(evt){
          this.setStroke('none');
          targetLayer.draw();
          if(gameState.showAdjacents===true) {
            var buddies = getAdjacentTargets(this);
            for (var i=0; i<buddies.length; i++) {
              targetCircles[buddies[i].level][buddies[i].row].setStroke('none');
            }
          }
          targetLayer.draw();
        });

        circle.on('dblclick', function(evt){
          console.log('doubleclicked ' + this.level + ' ' + this.row);
          var buddies = getGroup(pieceArray[this.level][this.row]);
          console.log('Returned group is:');
          console.log(buddies);
          for (var i=0; i< buddies.length; i++) {
            targetCircles[buddies[i].level][buddies[i].row].setStroke('red');
            targetCircles[buddies[i].level][buddies[i].row].setStrokeWidth(4);
            
          }
          targetLayer.draw();
        });
  
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

//}());