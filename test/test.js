//Libraries
var expect = require('chai').expect;
var sinon = require('sinon');

//helpers
var helpers = require('./helpers/setup-helper');

//files
var config = require('houz-config');
var expectedZips1 = require('./html-stub/html1').zpidsFromHTML;
var expectedZips2 = require('./html-stub/html2').zpidsFromHTML;
var expectedZips3 = require('./html-stub/html3').zpidsFromHTML;

var spy, stubqueue;

var messageFromRabbit = { pagenum: 'page', city: 'city' };

describe('Zip Ids', function() {
	
	before('stub out request & amqp and begin connection', function() {
		stubqueue = helpers.before();
	});

	beforeEach(function() {
		spy = helpers.beforeEach();
	});

	afterEach(function() {
		helpers.afterEach();
	});

	after('restore all', function() {
		helpers.after();
	});

	it('recieves the correct message structure', function() {
		expect(messageFromRabbit).to.have.all.keys(config.messageExpectations.pages);
	});
	
	it('publishes to the exchange each zipid for each page', function (done) {
		messageFromRabbit.city = 'san-jose-ca';
		messageFromRabbit.pagenum = '4';
		stubqueue.emit('message', messageFromRabbit);
		helpers.wait(function() {
			expect(spy.callCount).to.equal(expectedZips1.length); //see html stub 1

			messageFromRabbit.pagenum = '8';
			stubqueue.emit('message', messageFromRabbit);
			helpers.wait(function() {
				expect(spy.callCount).to.equal(expectedZips1.length + expectedZips2.length);
				
				messageFromRabbit.pagenum = '12';
				stubqueue.emit('message', messageFromRabbit);
				helpers.wait(function() {
					expect(spy.callCount).to.equal(expectedZips1.length + expectedZips2.length + expectedZips3.length);
					done();
				});
			});
		});
	});

	it('should publish to the exchange with the correct routingKey and message for each zipid', function (done) {
		messageFromRabbit.city = 'san-jose-ca';
		messageFromRabbit.pagenum = '4';
		stubqueue.emit('message', messageFromRabbit);
		helpers.wait(function() {
			testRoutingKeyandMessage(expectedZips1, 0);
			
			messageFromRabbit.pagenum = '8'; //now emit with new page
			stubqueue.emit('message', messageFromRabbit);
			helpers.wait(function() {
				testRoutingKeyandMessage(expectedZips2, expectedZips1.length);

				messageFromRabbit.pagenum = '12'; //now emit with new page
				stubqueue.emit('message', messageFromRabbit);
				helpers.wait(function() {
					testRoutingKeyandMessage(expectedZips3, expectedZips1.length + expectedZips2.length);
					done();
				});
			});
		});
	});

});

var testRoutingKeyandMessage = function(expectedZips, startingPoint) {
	var expectedRoutingKey = config.routingKey.zipids;
	var expectedMessageStructure = config.messageExpectations.zipids;

	for (var i = startingPoint; i < spy.callCount; i++) {
		var args = spy.args[i];
		var zip = expectedZips[i - startingPoint];

		expect(args[0]).to.equal(expectedRoutingKey);
		correctStructureOfMessage(args[1], expectedMessageStructure, {zipid: zip});
	};
};

var correctStructureOfMessage = function(message, expectedMessageStructure, expectedMessage) {
	//expectedMessageStructure comes from config, which is used in other repos as well
	//expected message is what we actually expect

	//the target object must both contain all of the passed-in keys AND the number of keys
	//in the target object must match the number of keys passed in (in other words, a target
	//object must have all and only all of the passed-in keys)
	expect(message).to.have.all.keys(expectedMessageStructure);

	//verify that the message has the expected properties
	for (var key in message) {
		expect(message).to.have.property(key, expectedMessage[key]);
	}
};
