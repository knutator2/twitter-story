app.controller('CaptureCtrl', function ($scope, $http) {

    $scope.binNameText = '';
    $scope.keywordsText = '';

    $scope.tracks = [];
    $scope.updateText = "Test";

    function getTrackInfo() {
        $http.get('/track/info').then(function(response) {
            console.log(response);
            $scope.tracks = response.data;
        });
    }

    $scope.startTrack = function() {
        console.log('New Track ' + $scope.binNameText + ' with keywords ' + $scope.keywordsText);
        $http({
            method: 'POST',
            url: '/track/manage/' +$scope.binNameText + '?keywords=' + encodeURIComponent($scope.keywordsText)
        }).then(function(response) {
            console.log("got response: ");
            console.log(response);
            getTrackInfo();
        })
    };

    $scope.stopTrack = function(name) {
        console.log("Stop track" + name);
        $http.delete('/track/manage/' + name)
            .then(function(response) {
                console.log(response);
                getTrackInfo();
            });
    };

    $scope.resumeTrack = function(name) {
        $http.post('/track/resume/' + name)
            .then(function(response) {
                console.log(response);
                getTrackInfo();
            })
    }

    console.log('loaded');
    getTrackInfo();
});
console.log('test');