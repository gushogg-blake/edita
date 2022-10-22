let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let Project = require("modules/Project");

module.exports = class extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		this.projects = [];
	}
	
	get all() {
		return this.projects;
	}
	
	async init() {
		this.projects = (await base.stores.projects.load()).map(Project.fromJson);
	}
}
