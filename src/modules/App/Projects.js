let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let unique = require("utils/array/unique");
let Project = require("modules/Project");

let projectRootFiles = [
	".git",
	"src",
	"license",
	"licence",
	"changelog",
	"contributing",
	"contributing.md",
	"cargo.toml",
	"package.json",
	"gradle.properties",
	"cmakelists.txt",
	"makefile",
	"composer.json",
];

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
	
	async findOrCreateProjectForUrl(url) {
		let project = this.all.find(project => project.ownsUrl(url));
		
		if (project) {
			return project;
		}
		
		let dirs = await bluebird.map(platform.fs(url.path).parents, async function(dir) {
			let files = (await dir.ls()).map(node => node.name.toLowerCase());
			
			return {
				dir,
				isProjectRoot: projectRootFiles.some(name => files.includes(name)),
			};
		});
		
		dirs.reverse();
		
		let projectRoot = dirs.find(dir => dir.isProjectRoot);
		
		if (!projectRoot) {
			return null;
		}
		
		return new Project([projectRoot.dir.path], {}, false);
	}
}

module.exports = Projects;
