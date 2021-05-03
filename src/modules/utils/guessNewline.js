module.exports = function(str) {
	let all = str.match(/(\r\n|\r|\n)/g);
	
	if (!all) {
		return null;
	}
	
	let crlf = 0;
	let cr = 0;
	let lf = 0;
	
	for (let sequence of all) {
		if (sequence === "\r\n") {
			crlf++;
		} else if (sequence === "\r") {
			cr++;
		} else {
			lf++;
		}
	}
	
	if (crlf + cr + lf === 0) {
		return null;
	}
	
	if (crlf > cr && crlf > lf) {
		return "\r\n";
	} else if (cr > crlf && cr > lf) {
		return "\r";
	} else if (lf > crlf && lf > cr) {
		return "\n";
	}
	
	if (crlf > 0) {
		return "\r\n";
	}
	
	if (cr > 0) {
		return "\r";
	}
	
	return "\n";
}
