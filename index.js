require('dotenv').config();

const {
	PORT,
	RATELIMIT_MAX,
	RATELIMIT_TIME
} = process.env;

if (!PORT) throw new Error('"PORT" is not defined');
if (!RATELIMIT_MAX) throw new Error('"RATELIMIT_MAX" is not defined');
if (!RATELIMIT_TIME) throw new Error('"RATELIMIT_TIME" is not defined');

const parseTZ = require('timezone-soft');
const getTZ = req => parseTZ(req.query?.timezone ?? 'UTC')[0]?.iana;

const christmas = require('@eartharoid/christmas');
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
	log.info(short(`(${req.raw.httpVersion}) ${req.ip} ${req.method} ${req.routerPath ?? '*'} &m-+>&r ${status}&b in ${response_time}`));
});

fastify.get('/', () => 'https://christmascountdown.live/api');

fastify.get('/timeleft', req => {
	const timezone = getTZ(req);
	return {
		months: christmas.getMonths(timezone),
		weeks: christmas.getWeeks(timezone),
		sleeps: christmas.getSleeps(timezone),
		days: christmas.getDays(timezone),
		hours: christmas.getHours(timezone),
		minutes: christmas.getMinutes(timezone),
		seconds: christmas.getSeconds(timezone)
	};
});

fastify.get('/timeleft/:period', (req, res) => {
	const period = req.params?.period;
	const timezone = getTZ(req);
	const allowed = ['months', 'weeks', 'sleeps', 'days', 'hours', 'minutes', 'seconds'];
	if (!allowed.includes(period)) {
		res.status(400);
		return {
			error: 400,
			message: 'Bad request'
		};
	}
	return christmas['get' + period.charAt(0).toUpperCase() + period.slice(1)](timezone);
});

fastify.get('/timeleft/total', req => {
	const timezone = getTZ(req);
	return christmas.getTotal(timezone);
});

fastify.get('/weekday', req => {
	const timezone = getTZ(req);
	return christmas.date(timezone).getDay();
});

fastify.get('/joke', () => jokes[Math.floor(Math.random() * jokes.length)]);

fastify.get('/jokes', () => jokes);

fastify.listen(PORT, '0.0.0.0', (error, address) => {
	if (error) log.error(error);
	else log.success(`HTTP server listening at ${address}`);
});