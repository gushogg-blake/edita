class FindAndReplace {
	constructor(app) {
		this.app = app;
	}
	
	findAll(...args) {
		console.log("findAll", ...args);
		
		return 123;
	}
}

module.exports = FindAndReplace;
