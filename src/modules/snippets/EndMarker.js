class EndMarker {
	constructor(index) {
		this.type = "endMarker";
		this.index = index;
	}
	
	getDefaultValue(context) {
		return "";
	}
}

module.exports = EndMarker;
