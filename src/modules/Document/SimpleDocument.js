let Base = require("./Base");
let Source = require("./Source");

class SimpleDocument extends Base {
	constructor(code, fileDetails=null) {
		super();
		
		this.fileDetails = fileDetails || base.getDefaultFileDetails();
		
		this.source = new Source(code, true);
		
		this.source.init(this.fileDetails);
	}
}

module.exports = SimpleDocument;
