var expect = require('chai').expect;
var Tracker = require('../modules/twitter-capture.js');
var monk = require('monk');
var Twitter = require('node-tweet-stream');

describe('Twitter Capture', function () {
    describe('Constructing', function() {
        it('simple correct construction', function(done) {
            new Tracker(new Twitter({
                consumer_key: '8tqSWXyazwcaUgpcN2QPdjzC3',
                consumer_secret: 'NTk0JzaYfbDPwwu9rn3wvtxc8wzymgK6zX1fG2yjDHWnrbAqFE',
                token: '763758236369555456-rkg5CY1ehIxwLtEGI2MSfHpGSTaXFw7',
                token_secret: 'a9AjPNOLtZz4t1BPZ0yIUyEzR5iCou11xvfQwjc7kXJb8'
            }), "mongodb://localhost:27017/exampleDb", function(err) {
                expect(err).to.be.undefined;
                done();
            });
        });
        it('simple correct construction without callback', function(done) {
            new Tracker(new Twitter({
                consumer_key: '8tqSWXyazwcaUgpcN2QPdjzC3',
                consumer_secret: 'NTk0JzaYfbDPwwu9rn3wvtxc8wzymgK6zX1fG2yjDHWnrbAqFE',
                token: '763758236369555456-rkg5CY1ehIxwLtEGI2MSfHpGSTaXFw7',
                token_secret: 'a9AjPNOLtZz4t1BPZ0yIUyEzR5iCou11xvfQwjc7kXJb8'
            }), "mongodb://localhost:27017/exampleDb");
            setTimeout(function () {
                done();
            }, 1000);
        });
    });
    describe('Working', function() {
        var tracker;
        beforeEach(function (done) {
            tracker = new Tracker(new Twitter({
                consumer_key: '8tqSWXyazwcaUgpcN2QPdjzC3',
                consumer_secret: 'NTk0JzaYfbDPwwu9rn3wvtxc8wzymgK6zX1fG2yjDHWnrbAqFE',
                token: '763758236369555456-rkg5CY1ehIxwLtEGI2MSfHpGSTaXFw7',
                token_secret: 'a9AjPNOLtZz4t1BPZ0yIUyEzR5iCou11xvfQwjc7kXJb8'
            }), "mongodb://localhost:27017/exampleDb", function() {
                done();
            });
        });
        afterEach(function (done) {
            tracker.db.dropDatabase(function () {
                done();
            });

        });
        it('db connection is active', function (done) {
             var collection = tracker.db.collection('test-twitter-story');
             collection.insert({'hello':'doc'});
             collection.find().toArray(function(err, docs) {
                expect(err).to.be.null;
                expect(docs).to.be.an('array');
                expect(docs).to.have.length.of(1);
                done();
            });
        });
        it('start tracking works', function(done) {
            var trackingName = 'london';
            var keywords = ['london'];
            tracker.startTrack(trackingName, keywords);
            tracker.db.collection(trackingName).find().toArray(function(err, items) {
                expect(err).to.be.null;
                expect(items).to.have.length.at.least(0);
                done();
            })
        })
        it('tracking tweets can be retrieved', function(done) {
            this.timeout(10000);
            var trackingName = 'london';
            var keywords = ['london'];
            tracker.startTrack(trackingName, keywords);
            setTimeout(function() {
                tracker.get(trackingName,{}, function(err, result) {
                    expect(err).to.be.null;
                    expect(result).to.have.length.above(0);
                    for (var i = 0; i < result.length; i++) {
                        var tweet = result[i];
                        expect(tweet).to.be.an('object')
                        expect(tweet.text.toLowerCase()).to.match(/london/);
                    }
                    done();
                });
            }, 3000)
        })
    });
});