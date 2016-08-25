const Express = require('express');
const MongoClient = require('mongodb').MongoClient;

var app = Express();
var DB;

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
    if(err){
        throw err;
    }
    DB = db;
    console.log('db connected');
});

app.all('*', function(req, res, next){
    res.append('Access-Control-Allow-Origin', '*');
    res.append('Access-Control-Allow-Methods', '*');
    res.append('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    if(req.method.toUpperCase() === 'OPTIONS'){
        res.send();
    }else{
        next();
    }
});


app.get('/sports/types', function (req, res) {
    var collection = DB.collection('events');

    collection.aggregate([
        {
            $group: { _id: '$sport' }
        }
    ]).toArray(function(err, result){
        if(err){
            console.log(err);
            res.sendStatus(500).end();
        }
        res.send(result);
    });

});


app.get('/sports', function (req, res) {
    var collection = DB.collection('events');

    var queryFilter = req.query['_filter'];
    var mongoFilter = {};

    if(queryFilter){
        queryFilter = queryFilter.split('|');
        if(queryFilter.length !== 2){
            res.sendStatus(400).end();
            console.log('bad filter format');
            return;
        }
        if(!['sport'].some(function(el){ return el === queryFilter[0] })){
            res.sendStatus(400).end();
            console.log('bad filter name');
            return;
        }

        mongoFilter[queryFilter[0]] = queryFilter[1];
    }

    collection.find(mongoFilter).toArray(function(err, result){
        if(err){
            console.log(err);
            res.sendStatus(500).end();
        }
        res.send(result);
    });

});


app.post('/sports/:id/vote/:type', function (req, res) {
    var id = parseInt(req.params.id);
    var type = parseInt(req.params.type);

    if(isNaN(id)){
        res.sendStatus(400).end();
        console.log("bad parameter: id");
        return;
    }

    if(isNaN(type)){
        res.sendStatus(400).end();
        console.log("bad parameter: type");
        return;
    }

    var collection = DB.collection('events');

    var fieldNamesMap = { 0: 'home', 1: 'away', 2:'draw' };
    var fieldName = 'votes.'+fieldNamesMap[type];
    var incObject = {};
    incObject[fieldName] = 1;

    collection.updateOne(
        { id: id },
        { $inc: incObject }
    ).then(function(result){
        if(result.result.ok === 1){
            res.send("ok").end();
        }else{
            console.log("can not update row");
            res.sendStatus(500).end();
        }
    }, function(err){
        res.sendStatus(500).end();
        console.log("can not update row: " + err);
    });
});



app.listen(8080, '0.0.0.0', function () {
    console.log('Start listening on port 8080');
});