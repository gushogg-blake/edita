let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let unique = require("utils/array/unique");
let Project = require("modules/Project");

class Projects extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		this.savedProjects = [];
	}
	
	get all() {
		return unique([
			...this.openProjects,
			...this.savedProjects,
		]);
	}
	
	get openProjects() {
		return unique(this.app.tabs.map(tab => tab.project).filter(Boolean));
	}
	
	async init() {
		let byKey = await base.stores.projects.loadAll();
		let json = Object.values(byKey);
		
		this.savedProjects = json.map(Project.fromJson);
	}
	
	findProjectForUrl(url) {
		return this.all.find(project => project.ownsUrl(url));
	}
}

module.exports = Projects;
