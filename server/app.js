var express = require('express');
var path = require('path');
var http = require('http');
var portNum = process.env.PORT || 3000;
// var index = require('./routes/index');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var logger = require('morgan');
// var favicon = require('static-favicon');
var Firebase = require("firebase");
/*
	[{
		cid: [
			{},
			{}
		]
	}]
*/
var sellQueue = []
var buyQueue = []

var app = express();
var ref = Firebase('https://popping-heat-7038.firebaseio.com/users');

// app.set('port', portNum);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(favicon());
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




var transactionFactory = function( userid, amount, price, timestamp){
	return {
		userid: userid,
		amount: amount,
		price: price,
		timestamp: timestamp
	}
}

//state 1 seller
// 		0 buyer
var checkDeal = function( uid, cid, price, amount, queue,  state ){
	var userRef = ref.child("users");
	var amountKeeper = amount ;
	var curUserBalance = 0;
	var curUserRef = userRef.orderByKey().equalTo(uid);
	curUserRef.child("balance").once('value',function(snap){
		curUserBalance = snap.val()
	});
	state = state ? 1 : -1;
	var dealArr = [];
	var target  = queue[cid] ;
	target.forEach(function(ele, index){
		if( amount <= 0){
			curUserRef.update({"balance":curUserBalance});
			return;
		}
		if( ele.price*state >= price*state){
			if(amount >= ele.amount){
				dealArr.push(ele);
				queue.splice(index,1);
				
				amount -= ele.amount;
				var tarUser = userRef.orderByKey().equalTo(ele.uid);
				var balDiff = 0;
				tarUser.child("balance").once('value',function(snap){
					balDiff = state*price*ele.amount;
					tarUser.update( {"balance": snap.val() - balDiff} );
				})
				tarUser.child("history").push({cid:cid, amount:amount, price: -1*state*price, timestamp: Date.now()});
				tarUser.child("portfolio").child(cid).once('value',function(snap){
					tarUser.child("portfolio").update({cid:snap.val()+state*ele.amount});
				});
				curUserBalance += balDiff;
			}
			else{
				var split = target[index];
				split.amount = amount;
				dealArr.push(split);
				target[index].amount = target[index].amount-amount;
				
				var tarUser = userRef.orderByKey().equalTo(ele.uid);
				var balDiff = 0;
				tarUser.child("balance").once('value',function(snap){
					balDiff = state*price*amount;
					tarUser.update( {"balance": snap.val() - balDiff} );
				})
				tarUser.child("portfolio").child(cid).once('value',function(snap){
					tarUser.child("portfolio").update({cid:snap.val()+state*amount});
				});
				curUserBalance += balDiff;
				
				tarUser.child("history").push({cid:cid, amount:amount, price: -1*state*price, timestamp: Date.now()});
				curUserRef.update({"balance":curUserBalance});
				curUserRef.child("history").push({cid:cid, amount:amountKeeper - amount, price: state*price, timestamp: Date.now()});

				amount = 0;
				return;
			}
		}
	});
	curUserRef.update({"balance":curUserBalance});
	curUserRef.child("history").push({cid:cid, amount:amountKeeper, price: state*price, timestamp: Date.now()});
	curUserRef.child("portfolio").child(cid).once('value',function(snap){
		curUserRef.child("portfolio").update({cid:snap.val()-state*amountKeeper});
	})
	return ;
}

app.post('/request/sell', function(req,res){
	var timestamp = process.hrtime();
	var uid = req.body.userid;
	var cid = req.body.companyid;
	var amount = req.body.amount;
	var price = req.body.price;
	var transaction = transactionFactory(uid, amount, price, timestamp);
	checkDeal(uid, cid, price, amount, price, buyQueue, true);
	if(amount > 0){
		sellQueue[cid].push(transaction);
	}
});

app.post('/request/buy', function(req,res){
	
	var timestamp = process.hrtime();
	var uid = req.body.userid;
	var cid = req.body.companyid;
	var amount = req.body.amount;
	var price = req.body.price;
	var transaction = transactionFactory(uid, amount, price, timestamp);
	var dealArr = checkDeal(uid, cid, price, amount, price, sellQueue, false);
	if(amount > 0){
		buyQueue[cid].push(transaction);
		dealArr.forEach(function(ele){

		});
		res.json({msg: "success"});
	}
})

app.get('/init' , function(req,res){
	var cmax = 100;
	for(var i = 0; i< cmax; ++i){
		sellQueue.push(new Array());
		buyQueue.push(new Array());
	}
	res.send("ok");
});

app.listen(portNum, "0.0.0.0", function() {
  console.log("Listening on " + portNum);
});
