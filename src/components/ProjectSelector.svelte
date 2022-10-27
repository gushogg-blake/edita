<script>
import {onMount, getContext} from "svelte";

let app = getContext("app");

let {projects} = base;
let {selectedProject} = app;
let {all: allProjects} = projects;

let showingSelector = false;

function onUpdate() {
	({all: allProjects} = projects);
}

function onSelect() {
	({selectedProject} = app);
}

onMount(function() {
	let teardown = [
		projects.on("update", onUpdate),
		app.on("selectProject", onSelect),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@import "classes/hide";

#main {
	padding: 2px;
}

#button {
	//font-weight: bold;
	border: 1px solid transparent;
	border-radius: 2px;
	padding: 4px 5px;
	//background: linear-gradient(white 0%, black 100%);
	
	&:hover {
		border: 1px solid #c3c0bf;
		background: linear-gradient(#f9f9f9 0%, #f1f0ed 100%);
	}
}
</style>

<div id="main">
	<div id="button">
		{selectedProject === projects.defaultProject ? "(No project selected)" : selectedProject.name}
	</div>
	<div id="selector" class:hide={!showingSelector}>
		
	</div>
</div>
