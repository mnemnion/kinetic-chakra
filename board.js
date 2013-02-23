     var stage = new Kinetic.Stage({
        container: 'container',
        width: 600,
        height: 600,
      });

      var layer = new Kinetic.Layer();
      // outerEdge defines the outeredge of the board
      var outerEdge = new Kinetic.Circle({ 
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        radius: stage.getWidth()/2 - 0.1*stage.getWidth()/2,
        fill: 'none',
        stroke: 'none',
        strokeWidth: 4
      });

      var chakraRing = new Kinetic.Group();
      var chakraRadius = outerEdge.getRadius()/2;
//      chakraRing.add(circle);

      for (var n=0; n<12; n++) {
        (function() {
        var i = n;
        var circle = new Kinetic.Circle({
          x: stage.getWidth() / 2 + chakraRadius*Math.cos(2*Math.PI*i/12),
          y: stage.getWidth() / 2 + chakraRadius*Math.sin(2*Math.PI*i/12),
          radius: chakraRadius,
          fill: 'none',
          stroke: 'black',
          strokeWidth: 4
        });

        console.log("creating ring " + i);
        console.log(circle.getRadius());
        chakraRing.add(circle);
        })();
      };

      var border = new Kinetic.Rect({
        x: 4,
        y: 4,
        width: stage.getWidth()-6,
        height: stage.getHeight()-6,
        stroke: 'black',
        strokeWidth: 4
      })

      // add the shape to the layer
     // layer.add(chakraRing[14]);
      layer.add(chakraRing);
      layer.add(border);

      // add the layer to the stage
      stage.add(layer);