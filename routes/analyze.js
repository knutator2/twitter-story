var express = require('express');
var router = express.Router();
var TwitterAnalyzer = require('../modules/analyzer');
var analyzer  = new TwitterAnalyzer("mongodb://localhost:27017/twitterstories");

router.get('/:track/users', function(req, res) {
    analyzer.getUsersForTrack(req.params.track).then(function (users) {
        res.status(200).send({message: 'showUsers for ' + req.params.track, users: users});
    })

});

router.get('/:track/tweets/series', function(req, res) {
   analyzer.getTweetSeriesForTrack(req.params.track)
       .then(function(tweets) {
            res.status(200).send(tweets);
        })
       .catch(console.log);
});

router.get('/:track/tweets/topusers/:amount', function(req, res) {
   analyzer.getTopUsersForTrack(req.params.track, parseInt(req.params.amount))
       .then(function(topUsers) {
           var userRequests = topUsers.map((user) => analyzer.getUserInformationForTrack(req.params.track, user._id))
           return Promise.all(userRequests).then((topUserInformation) => {
               topUserInformation.map((elem, index) => {
                   elem.tweets = topUsers[index].total;
               });
               return topUserInformation;
           })
       }).then((fullUserInformation) => {
            res.status(200).send(fullUserInformation);
   })
});

router.get('/:track/tweets/tophashtags/:amount', function(req, res) {
    analyzer.getTopHashTagsForTrack(req.params.track, parseInt(req.params.amount))
        .then(function(topHashtags) {
            res.status(200).send(topHashtags);
        })
});

router.get('/:track/network/mentions', function(req, res) {
   analyzer.getMentionsGraph(req.params.track)
       .then(function(mentions) {
           res.status(200).send(mentions);
       })
});

module.exports = router;


