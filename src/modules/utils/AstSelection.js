function s(startLineIndex, endLineIndex=startLineIndex) {
	return [
		startLineIndex,
		endLineIndex,
	];
}

let api = {
	s,
	
	equals(a, b) {
		let [aStart, aEnd] = a;
		let [bStart, bEnd] = b;
		
		return aStart === bStart && aEnd === bEnd;
	},
	
	isWithin(a, b) {
		let [aStart, aEnd] = a;
		let [bStart, bEnd] = b;
		
		return aStart >= bStart && aEnd <= bEnd;
	},
};

module.exports = api;
