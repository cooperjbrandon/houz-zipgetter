var RSVP, http, moment, clc, setup, exchange, queue, beginSetup;

RSVP = require('rsvp');
http = require('http');
clc = require('cli-color');
moment = require('moment');
setup = require('./setup');

beginSetup = setup.beginSetup;

var promise = new RSVP.Promise(function(resolve, reject) {
	beginSetup(resolve);
});

promise.then(function (resolvedValue) {
	queue = resolvedValue.queue;
	exchange = resolvedValue.exchange;
	subscribeToQueue();
});

var subscribeToQueue = function() {
	queue.subscribe({ack: true}, messageReceiver); //subscribe to queue
};

var messageReceiver = function(message, headers, deliveryInfo, messageObject) {
	console.log(clc.yellow('Message received: Page Number ' + message.pageNum + ' at ' + moment().format('MMMM Do YYYY, h:mm:ss a')));
	fetchZipIds(message.pageNum);
};

var fetchZipIds = function(pageNum) {
	var url = 'http://www.zillow.com/san-jose-ca/'+pageNum+'_p/';
	console.log(clc.green('SENDING REQUEST: Page '+ pageNum));
	http.get(url, function(result) {
		var html = '';
		console.log(clc.black.bgWhite('STATUS: ' + result.statusCode));
		result.on('data', function(chunk) {
			html += new Buffer(chunk).toString('utf8');
		});
		result.on('end', function() {
			var zips = parseZipIds(html);
			pushZipsToExchange(Object.keys(zips));
			console.log('____________________________________________________');
			queue.shift();
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
};

var pushZipsToExchange = function(zips) {
	console.log(clc.black.bgGreenBright(zips));
};

var parseZipIds = function(html) {
	var startIndex = 0, searchStrLen = '_zpid'.length, zpIds = {}, index;
	while ((index = html.indexOf('_zpid', startIndex)) > -1) {
		zpIds[getZipIdFromIndex(html, index)] = true; //get each zpid and save to object
		startIndex = index + searchStrLen;
	}
	return zpIds;
};

var getZipIdFromIndex = function(html, endingIndex) {
	//zpid will be "/url/<ZPID>_zpid/"
	var currentIndex = endingIndex - 1;
	while (html[currentIndex] !== '/') {
		currentIndex--; //keeping going until hitting a /
	}
	return html.substring(currentIndex + 1, endingIndex);
};