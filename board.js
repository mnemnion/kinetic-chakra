var stage = new Kinetic.Stage({
    container: 'container',
    width: 600,
    height: 600,
});

var boardLayer = new Kinetic.Layer();
var backgroundLayer = new Kinetic.Layer();
var targetLayer = new Kinetic.Layer();

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

var gameState = {
  isBlackMove: true
}

gameState.board = new Array(6);

for (var n=0; n < 12; n++) {
  gameState.board[n] = new Array(12);
}

var chakraRing = new Array();

// populate chakraRing group with circles.
for (var n=0; n<12; n++) {
  (function() {
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

  console.log("creating ring " + i);
  console.log(circle.getRadius());
  chakraRing[i]=circle;
  })();
};

var targetCircles = new Array();

for (n=1; n<7; n++) {
  (function(){
    var i = n;
    var ring = Array();
    ringRadius = chakraRadius * Math.sin(2*Math.PI*i/24);
    for (m=0; m<12; m++) {
      (function(){
        var i = m;
        if (n%2 === 0) {
          var offset = 0;
        } else {
          var offset = 0.5;
        }
        var circle = new Kinetic.Circle({
          x : stage.getHeight() / 2 + 2*ringRadius*Math.cos(2*Math.PI*(i+n/2)/12),
          y : stage.getHeight() / 2 + 2*ringRadius*Math.sin(2*Math.PI*(i+n/2)/12),
          radius : chakraRadius/8,
          fill : 'none',
          stroke : 'none',
          strokeWidth : 2,
          id: n + '~' + m
        });
        console.log("Creating target " + n + " sub " + m);

        circle.circleLevel = n;
        circle.circleNumber = m;


        circle.on('click', function(evt){
          if (gameState.isBlackMove) {
            this.setFill('black');
            gameState.isBlackMove = false;
          } else {
            this.setFill('white');
            gameState.isBlackMove = true;
          }
          console.log('clicked ' + this.circleLevel + ' ' + this.circleNumber);
          gameState.board[this.circleLevel][this.circleNumber] = this.getFill();
          console.log(this.circleLevel + ' sub ' + this.circleNumber + ' is now ' + gameState.board[this.circleLevel][this.circleNumber]);
          targetLayer.draw();
        });

        circle.on('mouseover', function(evt){
          this.setStroke('black');
          this.setStrokeWidth(4);
          targetLayer.draw();
        });

        circle.on('mouseleave', function(evt){
          this.setStroke('none');
          this.setStrokeWidth(2);
          targetLayer.draw();
        })
        ring.push(circle);
      })();
    }
  targetCircles.push(ring);
  })();
}


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
    console.log("adding targetCircles " + n + " sub " + m);
    targetLayer.add(targetCircles[n][m]);
  }
}



// add the layer to the stage
stage.add(backgroundLayer);
stage.add(boardLayer);
stage.add(targetLayer);

console.log("ready");