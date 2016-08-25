const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
    if (err) {
        throw err;
    }

    var collection = db.collection('events');

    collection.count({}).then(function(res){

        if(res > 0){
            console.log("data already loaded");
            db.close();
            return;
        }

        var data = require('./db.json');

        data.forEach(function(item){
            item.votes = { 'home': 0, 'away':0, 'draw':0 };
        });

        collection.insertMany(data, function(err) {
            if(err){
                throw err;
            }

            console.log("data loaded");
            db.close();
        });
    });

});

