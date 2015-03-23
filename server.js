var amqp, moment, clc, http,
		connection, queue, exchange, routingKey;

amqp = require('amqp');
moment = require('moment');
clc = require('cli-color');
http = require('http');

exchange = 'houz-exchange';
routingKey = 'pageNums';

var connectToQueue = function() {
	console.log(clc.blue('The connection is ready'));
	queue = connection.queue('houz-queue-getzips');
	queue.on('open', bindQueueToExchange);
};

var bindQueueToExchange = function() {
	console.log(clc.blue('The queue "' + queue.name + '" is ready'));
	queue.bind(exchange, routingKey);
	queue.on('queueBindOk', subscribeToQueue);
};

var subscribeToQueue = function() {
	console.log(clc.blue('The queue "' +queue.name+ '" is bound to the exchange "' +exchange+ '" with the routing key "' +routingKey+ '"'));
	queue.subscribe({ack: true}, messageReceiver);
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
			console.log(clc.black.bgGreenBright(Object.keys(zips)));
			console.log('____________________________________________________');
			queue.shift();
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
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

connection = amqp.createConnection();
connection.on('ready', connectToQueue);