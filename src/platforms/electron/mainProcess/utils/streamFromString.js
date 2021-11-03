let {PassThrough} = require("stream");

/*
NOTE Readable.from(string) should work but results in an empty response for
some reason
*/

module.exports = function(str) {
	let stream = new PassThrough();
	
	stream.push(str);
	stream.push(null);
	
	return stream;
}
