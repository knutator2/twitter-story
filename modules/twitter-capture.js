var MongoClient = require('mongodb').MongoClient;

var TrackerWriter = function (tracker, db, error) {
    var self = this;
    this.tracker = tracker;

    MongoClient.connect(db, function (err, db) {
        if (err) {
            if (error) error(err);
        }
        else {
            self.db = db;
            if(error)
                error();
            else
                setup();
        }
    });

    function setup() {
        self.getTracks()
        .then(function(tracks) {
            console.log('get tracks');
            console.log(tracks);
            for (var i = 0; i < tracks.length; i++) {
                var currentTrack = tracks[i];
                if (currentTrack.active) {
                    for (var j = 0; j < currentTrack.keywords.length; j++) {
                        self.tracker.track(currentTrack.keywords[j]);
                    }
                }
            }
        });
    }

    this.tracker.on('tweet', function (tweet) {
        //write to db“
        //console.log('incoming tweet');
        tweet.created_at = new Date(tweet.created_at);
        self.db.collection('meta').find().toArray(function (err, docs) {
            for (var i = 0; i < docs.length; i++) {
                var currentMeta = docs[i];
                if (currentMeta.keywords.some(function(item){return (new RegExp(item)).test(tweet.text.toLowerCase());}) ) {
                    var collection = self.db.collection(currentMeta.name);
                    collection.insert(tweet);
                }
            }
        });
    });

    this.tracker.on('error', function (error) {
        console.log('Something went terribly wrong in the twitter-tracker mdoule');
        console.log(error);
    })
};

TrackerWriter.prototype.startTrack = function (name, keywords) {
    var self = this;
    return new Promise(function(resolve, reject) {
        for (var i = 0; i < keywords.length; i++) {
            self.tracker.track(keywords[i]);
        }

        self.db.collection(name);
        var collection = self.db.collection('meta');

        collection.insert({
            "name": name,
            "keywords": keywords,
            "active" : true,
            "started" : Date.now()
        }, function (err) {
            if (err) {
                reject("There was a problem adding the information to the database");
            }
            resolve();
        });
    })

};

TrackerWriter.prototype.stopTrack = function (name) {
    var self = this;
    return self.stopTrackingKeywords(name)
        .then(self.updateInformationForTrack(name, {stopped: Date.now(), active: false}));
};

TrackerWriter.prototype.updateInformationForTrack = function(name, information) {
    var self = this;
    return self.db.collection('meta').findOneAndUpdate({name:name}, {$set: information})
}

TrackerWriter.prototype.stopTrackingKeywords = function(name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.keywordsForTrack(name)
            .then(function(tracks) {
                console.log('keywords');
                console.log(tracks);
                for (var i = 0; i < tracks.length; i++ ) {
                    self.tracker.untrack(tracks[i]);
                }
                resolve();
            });
    })
};

TrackerWriter.prototype.informationForTrack = function(name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        Promise.all([
            self.get('meta', {'name' : name}, {_id:0}),
            self.db.collection(name).count()
        ]).then(function(data) {
            var result = data[0][0];
            result.tweets = data[1];
            resolve(result)
        }, reject);

    })
};

TrackerWriter.prototype.informationForAllTracks = function() {
    var self = this;
    return self.getTracks()
        .then(function(data) {
            console.log(data);
            var trackPromises = data.map((item) => self.informationForTrack(item.name));
            return Promise.all(trackPromises);
        });
}

TrackerWriter.prototype.resumeTrack = function(name) {
    var self = this;
    return self.keywordsForTrack(name).then(function(keywords) {
        for (var i = 0; i < keywords.length; i++) {
            self.tracker.track(keywords[i]);
        }
    }).then(function() {
        self.updateInformationForTrack(name, {stopped: undefined, active: true})
    })
};


TrackerWriter.prototype.get = function (name, query, projection) {
    var self = this;
    return new Promise(function(resolve,reject) {
        query = query || {};
        projection = projection || {};
        var collection = self.db.collection(name);
        collection.find(query, projection).toArray(function (err, docs) {
            if (err) {
                reject(err);
            }
            resolve(docs);
        });
    })
};

TrackerWriter.prototype.keywordsForTrack = function(name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.get('meta', {'name' : name}, {"keywords" : 1})
            .then(function(docs) {
                console.log(docs[0].keywords);
                resolve(docs[0].keywords);
                }, function()  {
                    reject(new Error("No data found"));
                });
            })
};

TrackerWriter.prototype.getTracks = function() {
    return this.get('meta', {}, {"_id" : 0})
};

module.exports = TrackerWriter;