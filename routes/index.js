var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'Express'});
});

router.get('/index', function (req, res) {
    res.render('index', {title: 'Express'});
});

//Capture

router.get('/capture', function (req, res) {
    res.render('capture', {title: 'Capture'});
});

//Analysis

router.get('/analysis/overview/', function(req, res) {
    res.render('analysis/overview');
});

router.get('/analysis/events/', function(req, res) {
    res.render('analysis/events');
});

router.get('/analysis/statistics', function(req, res) {
    res.render('analysis/statistics');
});

router.get('/analysis/network', function(req, res) {
    res.render('analysis/network');
});

router.get('/analysis/reports', function(req, res) {
    res.render('analysis/reports');
});

module.exports = router;