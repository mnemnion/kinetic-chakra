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
  isMyMove: true,
  sliderSelected: false,
  blackCaptures: 0,
  whiteCaptures: 0,
  pieceIDs: 0,
  showChakras: false,
  showGroups: false,
  showSliding: false
};

gameState.nextTurn = function() {
  if (this.whichMove === 'black') {
    this.whichMove = 'white';
  } else {
    this.whichMove = 'black';
  }
  flipWhiteBlack();
  this.isSliding = false;
  this.sliderSelected = false;
  for (i=0; i < 6; i++) {
    for(j=0; j < gameState.numCircles; j++) {
      slideArray[i][j] = 'mt';
      targetArray[i][j].setStroke('none');
  }
  targetLayer.draw();
}

  console.log('next turn');
}

gameState.pieceAdded = function() {
  this.isSliding = true;
  console.log('piece added');
}

var boardLayer = new Kinetic.Layer();
var backgroundLayer = new Kinetic.Layer();
var targetLayer = new Kinetic.Layer();
var pieceLayer = new Kinetic.Layer();

// outerEdge defines the outer edge of the board
var outerEdge = new Kinetic.Circle({ 
  x: gameStage.getHeight() / 2,
  y: gameStage.getHeight() / 2,
  radius: gameStage.getHeight()/2 - 0.1*gameStage.getHeight()/2,
  fill: 'none',
  stroke: 'none',
  strokeWidth: 4
});

var chakraRadius = outerEdge.getRadius()/2;

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
  if(enemyGroup[0].getFill()==='black'){
    gameState.whiteCaptures += enemyGroup.length;
    console.log("White has captured " + gameState.whiteCaptures + " stones so far");
  } else {
    gameState.blackCaptures += enemyGroup.length;
    console.log("Black has captured " + gameState.blackCaptures + " stones so far");
  }
    console.log("destroying:");
    console.log(enemyGroup);
  for (i=0; i<enemyGroup.length; i++) {
    pieceArray[enemyGroup[i].level][enemyGroup[i].row] = 'mt';
    enemyGroup[i].setFill('none');
  }
  pieceLayer.draw();
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
    emanateKill(newPiece);
     // check for four surrounding enemies
    noAtari = getGroup(newPiece);
    var isOk = true;
    numLiberties = countLiberties(noAtari);
    if (numLiberties === 0) {
      killGroup([newPiece]);  
    } else {
      gameState.pieceAdded();
    }
    pieceLayer.draw();
}

 movePiece = function (piece, targetCircle) {
  if (pieceArray[targetCircle.level][targetCircle.row] === 'mt') {
    console.log('moving piece to ' + targetCircle.level + " sub " + targetCircle.row);
    pieceArray[targetCircle.level][targetCircle.row] = piece;
    //piece is in the array but doesn't know it
    pieceArray[piece.level][piece.row] = 'mt';
    //now we tell it
    piece.level = targetCircle.level;
    piece.row = targetCircle.row;
    // and physically move it
    piece.setX(targetCircle.getX());
    piece.setY(targetCircle.getY());
    gameState.nextTurn();
  } else {
    console.log("cannot move piece to occupied zone");
  }
  pieceLayer.draw();
}

calculateWin = function() {

};

// End Game Logic

// View Logic

// View functions

var chakraRing = new Array();

var makeFlipper = function() {
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
}
var flipWhiteBlack = makeFlipper();
flipWhiteBlack();

inspectButton = (function() {
  var inspectButton = new Kinetic.Rect ({
    x: gameStage.getWidth()*4/5,
    y: gameStage.getHeight()*2/5,
    cornerRadius: 6,
    height: 50,
    width: 150,
    fill: 'maroon',
    stroke: 'black',
    strokeWidth: 2
  })

  if (gameState.showChakras) {
    inspectButton.setFill('red');
  }

  inspectButton.on('click', function(evt){
    if (gameState.showChakras === false) {
      gameState.showChakras = true;
      this.setFill('red');
    } else {
      gameState.showChakras = false;
      this.setFill('maroon');
    }
    targetLayer.draw();

  });

  targetLayer.add(inspectButton);
  targetLayer.draw();
}());

(function() {
  var groupsButton = new Kinetic.Rect ({
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
    groupsButton.setFill('lightgreen');
  }

  groupsButton.on('click', function(evt){
    if (gameState.showGroups === false) {
      gameState.showGroups = true;
      this.setFill('lightgreen');
    } else {
      gameState.showGroups = false;
      this.setFill('darkgreen');
    }
    targetLayer.draw();
  });

  targetLayer.add(groupsButton);
  targetLayer.draw();
}());

var whiteSymbol = new Kinetic.Circle ({

});









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
      x: gameStage.getHeight() / 2 + chakraRadius*Math.cos(2*Math.PI*i/gameState.numCircles),
      y: gameStage.getHeight() / 2 + chakraRadius*Math.sin(2*Math.PI*i/gameState.numCircles),
      radius: chakraRadius,
      fill: 'none',
      stroke: color,
      strokeWidth: 4
    });

    chakraRing[i]=circle;
  };
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
                gameState.slider = pieceArray[this.level][this.row];
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
            movePiece(gameState.slider,slideArray[this.level][this.row]);
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
        if(gameState.showChakras) {
          var buddies = getChakras(this);
          for (var i=0; i<buddies[0].length; i++) {
            buddies[0][i].setStroke('lightgreen');
            buddies[0][i].setStrokeWidth(2);
          }
          for (var i=0; i<buddies[1].length; i++) {
            buddies[1][i].setStroke('lightblue');
            buddies[1][i].setStrokeWidth(2);
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
        targetLayer.draw();
        }

        if(gameState.showGroups) {
          if(pieceArray[this.level][this.row] !== 'mt'){
            var group = getGroup(pieceArray[this.level][this.row]);
            for (var i=0; i<group.length; i++) {
              targetArray[group[i].level][group[i].row].setStroke('blue');
              targetArray[group[i].level][group[i].row].setStrokeWidth(3);
            }
          }
        }
        targetLayer.draw();
      });

      circle.on('mouseleave', function(evt){
        if(!gameState.isSliding) {
          this.setStroke('none');
          targetLayer.draw(); 
        } else if (!gameState.sliderSelected) {
          this.setStroke('none');
          targetLayer.draw();
        }
        if(gameState.showChakras) {
          var buddies = getChakras(this);

          for (var i=0; i<buddies[0].length; i++) {
            buddies[0][i].setStroke('none');
            buddies[0][i].setStrokeWidth(2);
          } 
          for (i=0; i<buddies[1].length; i++) {
            buddies[1][i].setStroke('none');
            buddies[1][i].setStrokeWidth(2);
          }
          targetLayer.draw();
        }

         if(gameState.showSliding) {
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
          targetLayer.draw();
          }
        }

        if(gameState.showGroups) {
          if(pieceArray[this.level][this.row] !== 'mt') {
            var group = getGroup(pieceArray[this.level][this.row]);
            for (var i=0; i<group.length; i++) {
              //               console.log('turning off circles')
              targetArray[group[i].level][group[i].row].setStroke('none');
              targetArray[group[i].level][group[i].row].setStrokeWidth(2);
            }
          }  
        }
        targetLayer.draw();
      });

      circle.on('dblclick', function(evt){
        console.log('doubleclicked ' + this.level + ' ' + this.row);
        var buddies = getGroup(pieceArray[this.level][this.row]);
        console.log('Returned group is:');
        console.log(buddies);
        console.log("Number of liberties: " + countLiberties(buddies));
        for (var i=0; i< buddies.length; i++) {
          targetArray[buddies[i].level][buddies[i].row].setStroke('red');
          targetArray[buddies[i].level][buddies[i].row].setStrokeWidth(4);
        }
        var chakras = getChakras(this);
        console.log('chakras are');
        console.log(chakras);
        targetLayer.draw();
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
getChakras(targetArray[4][1]);

console.log("ready");

//}());