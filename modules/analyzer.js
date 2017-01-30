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
        collection.findOne({"from_user_id":userId}, function(err, item) {
            if (err) {
                reject(err);
            } else {
                fulfill({
                    name: item.from_user_name,
                    id: item.from_user_id,
                    lang: item.from_user_lang,
                    tweetcount: item.from_user_tweetcount,
                    followercount: item.from_user_followercount,
                    friendcount: item.from_user_friendcount,
                    listed: item.from_user_listed,
                    realname: item.from_user_realname,
                    utcoffset: item.from_user_utcoffset,
                    timezone: item.from_user_timezone,
                    description: item.from_user_description,
                    url: item.from_user_url,
                    verified: item.from_user_verified,
                    profile_image: item.from_user_profile_image_url,
                    created_at: item.from_user_created_at,
                    withheld_scope: item.from_user_withheld_scope,
                    favourites_count: item.from_user_favourites_count
                });
            }
        });
    });
};

TwitterAnalyzer.prototype.getTopUsersForTrack = function(track, amount) {
    var self = this;
    var collection = self.db.collection(track);
    return new Promise(function(fulfill, reject) {
        collection.aggregate([
            {$group: {_id: "$from_user_id", total: {$sum: 1}}},
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

TwitterAnalyzer.prototype.getTopHashTagsForTrack = function(track, amount) {
    var self = this;
    var collection = self.db.collection(track);

    //aggregate([{$unwind:"$hashtags"}, {$group: {_id:"$hashtags", count:{$sum: 1}}}, {$sort:{count:-1}}])
    return new Promise(function(fulfill, reject) {
        collection.aggregate([
            {$unwind:"$hashtags"},
            {$group: {_id:"$hashtags", count:{$sum: 1}}},
            {$sort:{count:-1}},
            {$limit:amount}
        ])
        .toArray(function(err, docs) {
            console.log(docs);
            var hashtags = docs.map((elem) => {return {count: elem.count, value:elem._id}})
            fulfill(hashtags);
        })
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
            {
                $group: {
                    _id: {
                        hour: {$hour: "$created_at"},
                        day: {$dayOfMonth: "$created_at"},
                        month: {$month: "$created_at"},
                        year: {$year: "$created_at"}
                    },
                    count: { $sum:1 }
                }
            }
        ]).toArray(function(err,docs) {
            if (err) {
                reject(err)
            } else {
                var series = docs.map(function(elem) {
                    return {count: elem.count, time: elem._id}
                });
                fulfill(series)
            }
        });
    })
};

module.exports = TwitterAnalyzer;

