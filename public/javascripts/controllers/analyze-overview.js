app.controller('AnalyzeOverviewCtrl', function($scope, $http) {
    $scope.tweetSeries = {series:[[1,2,3,4,5,6]], labels:[]};
    $scope.activeTrack = 'london';
    $scope.topUsers = [];
    $scope.topHashtags = [];

    function getTweetSeries() {
        $http.get('/analyze/' + $scope.activeTrack + '/tweets/series').then(function(response) {
            var tweets = response.data;
            $scope.tweetSeries.index = [];
            var min = parseInt(response.data.reduce(function(prev, curr) {
                return prev.timestamp_ms < curr.timestamp_ms ? prev.timestamp_ms : curr.timestamp_ms;
            }));
            var minCat =  Math.floor(min / 1000000) * 1000000;
            var groups = groupBy(tweets, function(x) { return Math.floor(x.timestamp_ms / 1000000) })
                            .map(function(elem, index) {
                                var category = index * 1000000 + minCat;
                                $scope.tweetSeries.labels.push(moment(category.toString(), 'x').format("YYYY-MM-DD"));
                                return elem.length;
                        });
            $scope.tweetSeries.series = [groups];
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
