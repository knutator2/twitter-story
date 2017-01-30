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
                if (currentTrack.active == true) {
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
        //tweet.created_at = new Date(tweet.created_at);
        self.db.collection('meta').find().toArray(function (err, docs) {
            for (var i = 0; i < docs.length; i++) {
                var currentMeta = docs[i];
                var tweetHasKeyword = currentMeta.keywords.some(function(item){return (new RegExp(item)).test(tweet.text.toLowerCase());})
                if (currentMeta.active == true && tweetHasKeyword) {
                    var collection = self.db.collection(currentMeta.name);
                    collection.insert(mapTweet(tweet));
                }
            }
        });
    });

    this.tracker.on('error', function (error) {
        console.log('Something went terribly wrong in the twitter-tracker mdoule');
        console.log(error);
    });

    function mapTweet(tweet) {
        var result = {
            id: tweet.id,
            created_at: new Date(tweet.created_at),
            from_user_name: tweet.user.screen_name,
            from_user_id: tweet.user.id,
            from_user_lang: tweet.user.lang,
            from_user_tweetcount: tweet.user.statuses_count,
            from_user_followercount: tweet.user.followers_count,
            from_user_friendcount: tweet.user.friends_count ,
            from_user_listed: tweet.user.listed_count,
            from_user_realname: tweet.user.name,
            from_user_utcoffset: tweet.user.utc_offset,
            from_user_timezone: tweet.user.time_zone,
            from_user_description: tweet.user.description,
            from_user_url: tweet.user.url,
            from_user_verified: tweet.user.verified,
            from_user_profile_image_url: tweet.user.profile_image_url,
            from_user_created_at: tweet.user.created_at,
            from_user_withheld_scope: tweet.user.withheld_scope,
            from_user_favourites_count: tweet.user.favourites_count,
            source: tweet.source,
            location: tweet.place,
            geo: tweet.coordinates,
            text: tweet.text,
            favorite_count: tweet.favourite_count,
            to_user_id: tweet.in_reply_to_user_id,
            to_user_name: tweet.in_reply_to_screen_name,
            in_reply_to_status_id: tweet.in_reply_to_status_id,
            filter_level: tweet.filter_level,
            lang: tweet.lang,
            possibly_sensitive: tweet.possibly_sensitive,
            quoted_status_id: tweet.quoted_status_id,
            truncated: tweet.truncated,
            withheld_copyright: tweet.withheld_copyright,
            withheld_scope: tweet.withheld_scope
        };
        if (tweet.retweeted_status) {
            result.retweet_id = tweet.retweeted_status.id;
            result.retweet_count = tweet.retweeted_status.retweet_count;
        } else {
            result.retweet_id = null;
            result.retweet_count = null;
        }
        return result;
    }
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