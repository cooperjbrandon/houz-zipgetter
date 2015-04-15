var request, clc, rabbit, beginSetup, handleZips;

request = require('request');
clc = require('cli-color');
rabbit = require('./rabbit-management');

beginSetup = rabbit.beginSetup;
handleZips = rabbit.handleZips;

var beginFetchOfZips = function(message, headers, deliveryInfo, messageObject) {
	fetchZipIds(message.pagenum, message.city);
};

var fetchZipIds = function(pagenum, city) {
	var url = 'http://www.zillow.com/'+city+'/'+pagenum+'_p/';
	request.get(url, function(error, response, body) {
		if (error) {
			console.log("Got error: " + error.message);
		} else {
			handleZips(parseZipIds(body));
		}
	});
};

var parseZipIds = function(html) {
	var startIndex = 0, searchStrLen = '_zpid'.length, zpIds = [], index;
	while ((index = html.indexOf('_zpid', startIndex)) > -1) {
		//get each zpid and save to array if not yet in array
		var zip = getZipIdFromIndex(html, index);
		if (zpIds.indexOf(zip) === -1) { zpIds.push(zip); }
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
