require('dotenv').config();

const {
	PORT,
	RATELIMIT_MAX,
	RATELIMIT_TIME
} = process.env;

if (!PORT) throw new Error('"PORT" is not defined');
if (!RATELIMIT_MAX) throw new Error('"RATELIMIT_MAX" is not defined');
if (!RATELIMIT_TIME) throw new Error('"RATELIMIT_TIME" is not defined');

const jokes = require('./jokes/en.json');

const Logger = require('leekslazylogger');
const log = new Logger();
const { short } = require('leeks.js');

const fastify = require('fastify')({ ignoreTrailingSlash: true });
fastify.register(require('fastify-cors'));
fastify.register(require('fastify-rate-limit'), {
	max: RATELIMIT_MAX,
	timeWindow: RATELIMIT_TIME
});
fastify.addHook('onResponse', (req, res, done) => {
	done();
	const status = (res.statusCode >= 500
		? '&4'
		: res.statusCode >= 400
			? '&6'
			: res.statusCode >= 300
				? '&3'
				: res.statusCode >= 200
					? '&2'
					: '&f') + res.statusCode;
	let response_time = res.getResponseTime().toFixed(2);
	response_time = (response_time >= 20
		? '&c'
		: response_time >= 5
			? '&e'
			: '&a') + response_time + 'ms';
	log.verbose.http(short(`(${req.raw.httpVersion}) ${req.ip} ${req.method} ${req.routerPath ?? '*'} &m-+>&r ${status}&b in ${response_time}`));
});

fastify.get('/', () => 'https://christmascountdown.live/api');

fastify.get('/joke', () => jokes[Math.floor(Math.random() * jokes.length)]);

fastify.get('/jokes', () => jokes);


fastify.listen(PORT, '0.0.0.0', (error, address) => {
	if (error) log.error(error);
	else log.success(`HTTP server listening at ${address}`);
});