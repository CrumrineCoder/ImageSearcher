// server.js
// where your node app starts
var entry = new Date(); 
function getRelInfo(json){
  json = json["items"];
	var newArr = [];
	json.forEach(function (search){
		var toReturn = {}; 
		toReturn.url = search.link;
		toReturn.snippet = search.snippet; 
		toReturn.thumbnail = search["image"].thumbnailLink;
		toReturn.context = search["image"].contextLink; 
		newArr.push(toReturn); 
	});
  return newArr;
}
/*
function formatDate(date){
	console.log(date);
	var year = date.getFullYear();
	var month = date.getMonth() + 1; 
	var day = date.getDate();
	var hour = date.getHours(); 
	var minute = date.getMinutes(); 
	var second = date.getSeconds(); 
	convertFormat(day); 
	convertFormat(month); 
	convertFormat(hour); 
	convertFormat(minute); 
	convertFormat(second); 	
	return year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second; 
}
*/
function convertFormat(time){
	if(time < 10){
		return "0" + time; 
	}
	else return time; 
}
// init project
var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient
var mLab = 'mongodb://' + process.env.HOST + '/' + process.env.NAME;

// Home Page
app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});
app.get("/api/latest/imagesearch/", function(request, response){

	MongoClient.connect(mLab, function (err, db) {
				if (err) {
					console.log("Unable to connect to server", err);
				} else {
					console.log("Connected to server")
					var collection = db.collection('searches');
					var takeAPeek = function(db, callback){
			      collection.find({},{_id:0}).sort({ $natural: -1 }).limit(10).toArray(function(err, docs) {
              response.send(JSON.stringify(docs));
            });
            //ddb.collection.find().sort({ $natural: -1 }).limit(N)
            //		lastSearches = 	collection.find().skip(collection.count()-2);
        //    console.log(lastSearches);
						//response.json(lastSearches); 
					}
					// Close out the database after finishing the function.
					takeAPeek(db, function () {
						db.close();
					});
				};		
			});
});

// Make a Search Request
app.get("/api/imagesearch/:search", function (request, response) {
	var url = "https://www.googleapis.com/customsearch/v1?key=" + process.env.KEY + "&cx=" + process.env.CX + "&q=" + request.params.search + "&searchType=image";
	https.request(url, function(callback) {
		var str = '';
		//another chunk of data has been recieved, so append it to `str`
		callback.on('data', function (chunk) {
			str += chunk;
		});
		//the whole response has been recieved, so we just print it out here
		callback.on('end', function () {
			str = JSON.parse(str);
			
			MongoClient.connect(mLab, function (err, db) {
				if (err) {
					console.log("Unable to connect to server", err);
				} else {
					console.log("Connected to server")
					var collection = db.collection('searches');
					var newSearch = function(db, callback){
						collection.insert([{term: request.params.search, when: entry}]);
					}
					// Close out the database after finishing the function.
					newSearch(db, function () {
						db.close();
					});
				};		
			});
			response.send(getRelInfo(str));
		});
	}).end();
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
