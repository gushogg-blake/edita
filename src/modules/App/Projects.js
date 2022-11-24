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
		this._selectedProject = this.selectedProject;
		
		app.on("tabCreated", this.onTabCreated.bind(this));
		app.on("tabClosed", this.onTabClosed.bind(this));
		app.on("selectTab tabClosed document.projectChanged", this.update.bind(this));
	}
	
	get selectedProject() {
		return this.app.selectedTab?.project;
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
		
		let node = platform.fs(url.path);
		
		let dirs = await bluebird.map(node.parents, async function(dir) {
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
		
		let projectRoot = dirs.find(dir => dir.isProjectRoot)?.dir.path || node.parent.path;
		
		project = new Project([projectRoot], null, false);
		
		this.inferredProjects.push(project);
		
		return project;
	}
	
	async createFromDirs(dirs) {
		let project = new Project(dirs, {}, true);
		
		if (this.all.some(p => p.key === project.key)) {
			throw new Error("Project already exists");
		}
		
		await project.save();
		
		this.savedProjects.push(project);
		
		this.fire("update");
		
		return project;
	}
	
	onTabCreated(tab) {
		tab.project.tabCreated(tab);
		
		this.fire("update");
	}
	
	onTabClosed(tab) {
		let {project} = tab;
		
		if (!this.openProjects.includes(project)) {
			removeInPlace(this.inferredProjects, project);
		}
		
		project.tabClosed(tab);
		
		this.fire("update");
	}
	
	update() {
		let {selectedProject} = this;
		
		if (this._selectedProject !== selectedProject) {
			this._selectedProject = selectedProject;
			
			this.fire("select");
		}
	}
}

module.exports = Projects;
