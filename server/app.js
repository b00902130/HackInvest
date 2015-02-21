var express = require('express');
var path = require('path');
var http = require('http');
var portNum = process.env.PORT || 3000;
var index = require('./routes/index');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var favicon = require('static-favicon');



var app = express();

// app.set('port', portNum);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//routes, render
app.get('/queryAndDeletePage', index.queryAndDeletePageLoad);
app.get('/modifyPage', index.modifyPageLoad);
app.get('/queryCategoryPage', index.queryCategoryPageLoad);

//routes, functions
app.get('/', index.load);
app.post('/getGoodsByID', index.getGoodsByID);
app.post('/checkGoodID', index.checkGoodID);
app.post('/getGoodsByName', index.getGoodsByName);
app.post('/getGoodsListByCategory', index.getGoodsListByCategory);
app.post('/addNewGoods', index.addNewGoods);
app.post('/deleteGoodsByName', index.deleteGoodsByName);
app.post('/deleteGoodsByID', index.deleteGoodsByID);
// app.post('/modifyGoodsByName', index.modifyGoodsByName);
app.post('/modifyGoodsByID', index.modifyGoodsByID);

// app.get('/', function(req, res){
//     res.send('hello world');
// });


// Mongodb construct.
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

  // Connect using the connection string
  MongoClient.connect("mongodb://124.250.208.21/aipustore", {native_parser:true}, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection("allGoods");
    collection.findOne({"idx":129}, function(err, item) {
      assert.equal(null, err);
      console.log(item);
      db.close();
    })
  });

app.listen(portNum, "0.0.0.0", function() {
  console.log("Listening on " + portNum);
});
