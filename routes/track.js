var express = require('express');
var router = express.Router();
var Twitter = require('node-tweet-stream');
var Tracker = require('../modules/twitter-capture.js');

var tracker = new Tracker(new Twitter({
    consumer_key: '8tqSWXyazwcaUgpcN2QPdjzC3',
    consumer_secret: 'NTk0JzaYfbDPwwu9rn3wvtxc8wzymgK6zX1fG2yjDHWnrbAqFE',
    token: '763758236369555456-rkg5CY1ehIxwLtEGI2MSfHpGSTaXFw7',
    token_secret: 'a9AjPNOLtZz4t1BPZ0yIUyEzR5iCou11xvfQwjc7kXJb8'
}), "mongodb://localhost:27017/twitterstories");

/* GET users listing. */
 router.get('/*', function(req, res, next) {
     res.header("Content-Type", 'application/json');
     console.log('pre called');
     next();
 });

router.get('/', function(req, res) {
    console.log('error called');
    res.status(400).json({'error':'no name specified'});

});

router.get('/info/', function(req,res) {
    tracker.informationForAllTracks()
        .then(function(data) {
            res.status(200).send(data)
        });
});

router.get('/info/:trackingName', function(req, res) {
    console.log('info called');
    if (req.params.trackingName) {
        tracker.informationForTrack(req.params.trackingName)
            .then(function(data) {
                res.status(200).send(data);
            })
    } else {
        res.status(400).send({'error': 'no tracking name specified'})
    }
});

router.post('/manage/:trackingName', function(req, res) {
    console.log('tracking name called');
    console.log(req.query.keywords);
    if (req.query.keywords) {
        var keywords = decodeURIComponent(req.query.keywords).split(',');
        tracker.startTrack(req.params.trackingName,keywords)
        .then(function() {
            var keywordstring = keywords.join(' and ');
            res.status(200).send({'message' : 'start track for keywords:' + keywordstring});
        });
     } else {
        res.status(400).send({'error':'no keywords specified'});
     }
});

router.post('/resume/:trackingName', function(req, res) {
    if (req.params.trackingName) {
        tracker.resumeTrack(req.params.trackingName)
            .then(function() {
                res.status(200).send({message: 'Resumed track ' + req.params.trackingName});
            }, function() {
                res.status(400).send({message: 'Error resuming track ' + req.params.trackingName});
            })
    }
});

router.delete('/manage/:trackingName', function(req,res) {
    tracker.stopTrack(req.params.trackingName)
    .then(function() {
        res.status(200).send({'message' : 'track ' + req.params.trackingName + ' deleted'});
    });
});



module.exports = router;
