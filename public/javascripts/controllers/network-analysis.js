app.controller('AnalyzeNetworkCtrl', function($scope, $http) {
  $scope.test = 'it works!';
  $scope.mentions = [];
  $scope.mentionsAmount = {};
  $scope.activeTrack = 'london';
  $scope.degree = 1;

  function getMentions() {
    $http.get('/analyze/' + $scope.activeTrack + '/network/mentions').then(function (response) {

      $scope.slider = {
        minValue: 1,
        maxValue: 8,
        options: {
          floor: 1,
          ceil: 10,
          draggableRange: true,
          onEnd: endSlider
        }
      };
      $scope.mentions = response.data;
      $scope.mentionsAmount = response.data.mentioned;
      console.log('response');
      var max = 0;
      var obj = response.data.mentioned;
      for (var key in obj) {
        if(!obj.hasOwnProperty(key)) continue;
        if (obj[key] > max)
          max = obj[key]
      }
      $scope.slider.options.ceil = max;
      $scope.slider.maxValue = max;
// Generate a random graph:
      var g = { nodes: [], edges: []};
      for (var i = 0; i < response.data.nodes.length; i++)
        g.nodes.push({
          id: response.data.nodes[i],
          label: response.data.nodes[i],
          x: Math.random(),
          y: Math.random(),
          size: Math.random(),
          color: '#666'
        });
      for (var i = 0; i < response.data.edges.length; i++)
        g.edges.push({
          id: 'e' + i,
          source: response.data.edges[i].from,
          target: response.data.edges[i].to,
          size: Math.random(),
          color: '#ccc'
        });
      sigma.renderers.def = sigma.renderers.canvas;
      s = new sigma({
        graph: g,
        renderer: {
          container: document.getElementById('network'),
          type: 'canvas'
        },
        settings: {
          dragNodeStickiness: 0.01,
          borderSize: 2,
          outerBorderSize: 3,
          defaultNodeBorderColor: '#fff',
          defaultNodeOuterBorderColor: 'rgb(236, 81, 72)',
          enableEdgeHovering: false,
          edgeHoverHighlightNodes: 'circle',
        }
      });
      // Instanciate the ActiveState plugin:
      var activeState = sigma.plugins.activeState(s);
      // Initialize the dragNodes plugin:
      var dragListener = sigma.plugins.dragNodes(s, s.renderers[0], activeState);
      // Initialize the Select plugin:
      var select = sigma.plugins.select(s, activeState);
      // Initialize the Keyboard plugin:
      var keyboard = sigma.plugins.keyboard(s, s.renderers[0]);
      // Bind the Keyboard plugin to the Select plugin:
      select.bindKeyboard(keyboard);
      dragListener.bind('startdrag', function (event) {
        console.log(event);
      });
      dragListener.bind('drag', function (event) {
        console.log(event);
      });
      dragListener.bind('drop', function (event) {
        console.log(event);
      });
      dragListener.bind('dragend', function (event) {
        console.log(event);
      });
      //Initialize filter plugin
      var filter = sigma.plugins.filter(s);
      function endSlider(id, modelValue, highValue) {
        console.log('slider ends on ' + modelValue + ' to ' + highValue);
        filter
            .undo('nodesHigh', 'nodesLow')
            .nodesBy(function(n) {
              return $scope.mentionsAmount[n.id] < highValue;
            }, 'nodesHigh')
            .nodesBy(function(n) {
              return $scope.mentionsAmount[n.id] > modelValue;
            }, 'nodesLow')
            .apply();
      }

    });
  }
  getMentions();
});
