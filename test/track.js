var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var request = require('supertest');
var app = require('../app.js');

describe('Track Route', function() {
    it('call without bin name', function(done) {
        request(app)
            .get('/track')
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .end(function(err, res){
                if (err) throw err;
                console.log(res.body);
                expect(res.body.error).to.not.be.undefined;
                done();
            });
    });
    it('track london without keywords', function(done) {
        request(app)
            .get('/track/london')
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .end(function(err, res){
                if (err) throw err;
                console.log(res.body);
                expect(res.body.error).to.not.be.undefined;
                expect(res.body.error).to.match(/keywords/);
                done();
            });
    });
    it('track london with keywords', function(done) {
        request(app)
            .get('/track/london?keywords=london,paris')
            .expect('Content-Type', /application\/json/)
            .expect(200)
            .end(function(err, res){
                if (err) throw err;
                console.log(res.body);
                expect(res.body.error).to.be.undefined;

                done();
            });
    });
});