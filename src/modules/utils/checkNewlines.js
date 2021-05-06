module.exports = function(str) {
	let mixed = false;
	let mostCommon = null;
	let all = str.match(/(\r\n|\r|\n)/g);
	
	if (!all) {
		return {
			mixed,
			mostCommon,
		};
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
		return {
			mixed,
			mostCommon,
		};
	}
	
	mixed = [crlf, cr, lf].filter(c => c > 0).length > 1;
	
	if (crlf > cr && crlf > lf) {
		mostCommon = "\r\n";
	} else if (cr > crlf && cr > lf) {
		mostCommon = "\r";
	} else if (lf > crlf && lf > cr) {
		mostCommon = "\n";
	}
	
	if (mostCommon) {
		return {
			mixed,
			mostCommon,
		};
	}
	
	return {
		mixed,
		mostCommon: "\n",
	};
}
