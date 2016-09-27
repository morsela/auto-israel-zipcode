var minify = require('express-minify');
var compression = require('compression');
var express = require('express');

var app = express();
var http = require('http');
var request = require('request');

app.set('port', (process.env.PORT || 5000));

app.use(compression());
app.use(minify());

app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

function search_zipcode(location, street, house_number, callback) {
	request({
        uri: "http://www.israelpost.co.il/zip_data.nsf/SearchZipJSON?OpenAgent",
        method: 'GET',
        json: true,
        qs: { "Location": location, "POB": "", "Street": street, "House": house_number, "Entrance": ""}
    }, function(error, response, body) {
    	if (error || body == undefined) { 
    		console.log(error); 
    		callback(undefined);
    		return; 
    	}

        callback(body.zip);
    }); 
}

app.get('/', function (req, res) {
    res.render('pages/index');
});

app.post('/locate', function (req, res) {
	if (req.body.city != undefined && req.body.street != undefined && req.body.house_number != undefined) {
		search_zipcode(req.body.city, req.body.street, req.body.house_number, function(zipcode) {
			if (zipcode != undefined) {
				res.json({ zipcode: zipcode });
			} else {
				res.json();
			}
		});
	} else {
        res.json();
	}
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});