var TwitterAnalyzer = function(db, error) {
    var self = this;
    var MongoClient = require('mongodb').MongoClient;

    MongoClient.connect(db, function (err, db) {
        if (err) {
            if (error) error(err);
        }
        else {
            self.db = db;
            if(error)
                error();
        }
    });

};

TwitterAnalyzer.prototype.get = function (name, query, projection) {
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

TwitterAnalyzer.prototype.getUserInformationForTrack = function(track, userId) {
    var self = this;
    var collection = self.db.collection(track);
    return new Promise(function(fulfill, reject) {
        collection.findOne({"user.id":userId}, function(err, item) {
            if (err) {
                reject(err);
            } else {
                fulfill(item.user);
            }
        });
    });
};

TwitterAnalyzer.prototype.getTopUsersForTrack = function(track, amount) {
    var self = this;
    var collection = self.db.collection(track);
    return new Promise(function(fulfill, reject) {
        collection.aggregate([
            {$group: {_id: "$user.id", total: {$sum: 1}}},
            {$sort:{total:-1}},
            {$limit:amount}])
        .toArray(function(err, docs) {
            if (err) {
                reject(err)
            }
            else {
                fulfill(docs);
            }
        });
    });
};

TwitterAnalyzer.prototype.getTopHashTagsForTrack = function(track, minAmount) {
    var self = this;
    var collection = self.db.collection(track);

    var map = function() {
        for (var i = 0; i < this.entities.hashtags.length; i++) {
            emit(this.entities.hashtags[i].text, 1)
        }
    };

    var reduce = function(hashtag, amount) {
        return Array.sum(amount);
    };

    return new Promise(function(fulfill, reject) {
        collection.mapReduce(map, reduce, {out: {inline:1}, verbose: true}, function(err,results, stats) {
            if (err) {
                reject(err);
            }
            else {
                results = results.sort(function (a, b) {
                    return b.value - a.value
                });
                fulfill(results.slice(0, minAmount));
            }
        });
    });
};

TwitterAnalyzer.prototype.getMentionsGraph = function(track) {
    var self = this;
    var collection = self.db.collection(track);

    return new Promise(function(fulfill, reject) {
        collection.aggregate([
            {$match: {'entities.user_mentions.1': { $exists:true}}},
            {$project: {user: '$user.screen_name', mentioned:'$entities.user_mentions'}},
            {$unwind: '$mentioned'},
            {$project: {user:1, mentioned:'$mentioned.screen_name'}},
            {$group: {_id:'$user', mentioned: {$push:'$mentioned'}}}
        ]).toArray(function(err, docs) {
            if (err)
                reject(err);
            else
                fulfill(self.createGraphFromMentionsData(docs));
        });
    });
};

TwitterAnalyzer.prototype.createGraphFromMentionsData = function(data) {
    var nodes = new Set();
    var edges = [];
    var mentioned = {};
    for (var i = 0; i < data.length; i++) {
        var username = data[i]._id;
        var mentions = data[i].mentioned;
        nodes.add(username);
        for (var j = 0; j < mentions.length; j++) {
            nodes.add(mentions[j]);
            edges.push({from: username, to: mentions[j]});
            mentioned[mentions[j]] ?  mentioned[mentions[j]] += 1 : mentioned[mentions[j]] = 1;
        }
    }
    return {
        nodes: Array.from(nodes),
        edges: edges,
        mentioned: mentioned
    }
};

TwitterAnalyzer.prototype.getTweetSeriesForTrack = function(track) {
    var self = this;
    var collection = self.db.collection(track);
    return new Promise(function(fulfill, reject) {
        collection.aggregate([
            {$project: {timestamp_ms:1}},
            {$sort: {timestamp_ms: -1}}
        ]).toArray(function(err,docs) {
            if (err) {
                reject(err)
            } else {
                fulfill(docs)
            }
        });
    })
};

module.exports = TwitterAnalyzer;

