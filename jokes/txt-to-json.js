const fs = require('fs');
const text = fs.readFileSync('./jokes.txt', { encoding: 'utf8' });
let jokes = text.split('\r\n');
jokes = jokes.map(joke => {
	joke = joke.split('? ');
	return {
		question: joke[0] + '?',
		answer: joke[1]
	};
});
fs.writeFileSync('./jokes.json', JSON.stringify(jokes, null, '\t'));
console.log(`Converted ${jokes.length} jokes`)