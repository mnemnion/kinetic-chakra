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
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        radius: stage.getWidth()/2 - 0.1*stage.getWidth()/2,
        fill: 'none',
        stroke: 'none',
        strokeWidth: 4
      });

      var chakraRadius = outerEdge.getRadius()/2;

      var chakraRing = new Kinetic.Group();

      // populate chakraRing group with circles.
      for (var n=0; n<12; n++) {
        (function() {
        var i = n;
        var color = '';
        if (i%2===0){
            color = 'black';
        } else {
            color = 'red';
        };
        var circle = new Kinetic.Circle({
          x: stage.getWidth() / 2 + chakraRadius*Math.cos(2*Math.PI*i/12),
          y: stage.getWidth() / 2 + chakraRadius*Math.sin(2*Math.PI*i/12),
          radius: chakraRadius,
          fill: 'none',
          stroke: color,
          strokeWidth: 4
        });

        console.log("creating ring " + i);
        console.log(circle.getRadius());
        chakraRing.add(circle);
        })();
      };

      var targetCircles = new Kinetic.Group();

      for (n=0; n<12; n++) {
        (function(){
          var i = n;
          var circle = new Kinetic.Circle({
            x : stage.getWidth() / 2 + 2*chakraRadius*Math.cos(2*Math.PI*i/12),
            y : stage.getWidth() / 2 + 2*chakraRadius*Math.sin(2*Math.PI*i/12),
            radius : chakraRadius/8,
            fill : 'none',
            stroke : 'green',
            strokeWidth : 2
          })
          targetCircles.add(circle);
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

      boardLayer.add(chakraRing);
      backgroundLayer.add(border);

      // add the layer to the stage
      stage.add(backgroundLayer);
      stage.add(boardLayer);