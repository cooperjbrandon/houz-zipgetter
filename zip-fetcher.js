var http, clc, rabbit, beginSetup, handleZips;

http = require('http');
clc = require('cli-color');
rabbit = require('./rabbit-management');

beginSetup = rabbit.beginSetup;
handleZips = rabbit.handleZips;

var beginFetchOfZips = function(message, headers, deliveryInfo, messageObject) {
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
			handleZips(Object.keys(zips));
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

beginSetup(beginFetchOfZips);
