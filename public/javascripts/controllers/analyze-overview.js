app.controller('AnalyzeOverviewCtrl', function($scope, $http) {
    $scope.tweetSeries = {series:[[1,2,3,4,5,6]], labels:[]};
    $scope.activeTrack = 'brexit_sample';
    $scope.topUsers = [];
    $scope.topHashtags = [];

    function getTweetSeries() {
        $http.get('/analyze/' + $scope.activeTrack + '/tweets/series').then(function(response) {
            var tweets = response.data;
            $scope.tweetSeries.index = [];

            $scope.tweetSeries.series = [tweets.map(function(elem) { return elem.count})];
        })
    }

    function getTopUsers(amount) {
        $http.get('/analyze/' + $scope.activeTrack + '/tweets/topusers/' + amount)
            .then(function(response) {
                $scope.topUsers = response.data;
            });
    }

    function getTopHashtags(amount) {
        $http.get('/analyze/' + $scope.activeTrack + '/tweets/tophashtags/' + amount)
            .then(function(response) {
                $scope.topHashtags = response.data;
            });
    }

    function groupBy(ary, keyFunc) {
        var r = {};
        ary.forEach(function(x) {
            var y = keyFunc(x);
            r[y] = (r[y] || []).concat(x);
        });
        return Object.keys(r).map(function(y) {
            return r[y];
        });
    }

    getTweetSeries();
    getTopUsers(5);
    getTopHashtags(10);
});
