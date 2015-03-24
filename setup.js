var amqp, clc, RSVP, resolve,
		connection, routingKey,
		queue, queueName, queueConnected,
		exchange, exchangeName, exchangeConnected;

amqp = require('amqp');
clc = require('cli-color');
RSVP = require('rsvp');

exchangeName = 'houz-exchange';
queueName = 'houz-queue-getzips';
routingKey = 'pageNums';

var beginSetup = function(promiseResolve) {
	resolve = promiseResolve;
	connection = amqp.createConnection();
	connection.on('ready', connectToQueueAndExchange);
};

var connectToQueueAndExchange = function() {
	console.log(clc.blue('The connection is ready'));
	connectToQueue();
	connectToExchange();
};

var connectToExchange = function() {
	exchange = connection.exchange(exchangeName, {autoDelete: false}); //connect to exchange
	exchange.on('open', function() { queueOrExchangeReady('exchange'); });
}

var connectToQueue = function() {
	queue = connection.queue(queueName); //connect to queue
	queue.on('open', bindQueueToExchange);
};

var bindQueueToExchange = function() {
	console.log(clc.blue('The queue "' + queue.name + '" is ready'));
	queue.bind(exchangeName, routingKey); //bind to exchange w/ routingKey (most likely already done; this is just incase)
	queue.on('queueBindOk', function() { queueOrExchangeReady('queue'); });
};

var queueOrExchangeReady = function(type) {
	if (type === 'exchange') {
		console.log(clc.bgBlueBright('The exchange "' +exchange.name+ '" is ready'));
		exchangeConnected = true;
	} else if (type === 'queue') {
		console.log(clc.blue('The queue "' +queue.name+ '" is bound to the exchange "' +exchangeName+ '" with the routing key "' +routingKey+ '"'));
		queueConnected = true;
	}
	if (exchangeConnected && queueConnected) { resolve({queue: queue, exchange: exchange}); }
};

module.exports.beginSetup = beginSetup;
