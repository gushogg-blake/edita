let bluebird = require("bluebird");
let Evented = require("utils/Evented");
let unique = require("utils/array/unique");
let {removeInPlace} = require("utils/arrayMethods");
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
	"rakefile",
	"gemfile",
];

class Projects extends Evented {
	constructor(app) {
		super();
		
		this.app = app;
		this.savedProjects = [];
		this.inferredProjects = [];
		
		app.on("tabCreated", this.onTabCreated.bind(this));
		app.on("tabClosed", this.onTabClosed.bind(this));
	}
	
	get all() {
		return [...this.savedProjects, ...this.inferredProjects];
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
	
	async findOrCreateProjectForUrl(url) {
		let project = this.findProjectForUrl(url);
		
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
		
		// check again, as a tab might have opened while we were fetching the dirs
		
		project = this.findProjectForUrl(url);
		
		if (project) {
			return project;
		}
		
		dirs.reverse();
		
		let projectRoot = dirs.find(dir => dir.isProjectRoot);
		
		if (!projectRoot) {
			return null;
		}
		
		project = new Project([projectRoot.dir.path], {}, false);
		
		this.inferredProjects.push(project);
		
		return project;
	}
	
	async createFromDirs(dirs) {
		let project = new Project(dirs, {}, true);
		
		if (this.all.some(p => p.key === project.key)) {
			throw "Project already exists";
		}
		
		await project.save();
		
		this.savedProjects.push(project);
		
		return project;
	}
	
	onTabCreated(tab) {
		tab.project?.tabCreated(tab);
		
		this.fire("update");
	}
	
	onTabClosed(tab) {
		let {project} = tab;
		
		if (project && !this.openProjects.includes(project)) {
			removeInPlace(this.inferredProjects, project);
		}
		
		project?.tabClosed(tab);
		
		this.fire("update");
	}
}

module.exports = Projects;
