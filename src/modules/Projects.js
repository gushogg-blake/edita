let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let Project = require("modules/Project");

class Projects extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		this.projects = [];
		this.defaultProject = new Project([platform.systemInfo.homeDir], {}, false);
	}
	
	get all() {
		return this.projects;
	}
	
	async init() {
		this.projects = (await base.stores.projects.load()).map(Project.fromJson);
	}
	
	findProjectForUrl(url) {
		return this.projects.find(project => project.ownsUrl(url));
	}
	
	static fromJson(details) {
		
	}
}

module.exports = Projects;
