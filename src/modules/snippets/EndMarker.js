class EndMarker {
	constructor(length) {
		this.type = "endMarker";
		this.start = length;
		this.end = length;
	}
	
	getDefaultValue(context) {
		return "";
	}
}

module.exports = EndMarker;
