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


</style>

<div id="main">
	<div id="button">
		{selectedProject.name}
	</div>
	<div id="selector" class:hide={!showingSelector}>
		
	</div>
</div>
