<script>
import {onMount, getContext} from "svelte";
import {on, off} from "utils/dom/domEvents";
import lineage from "utils/dom/lineage";
import replaceHomeDirWithTilde from "utils/replaceHomeDirWithTilde";

let app = getContext("app");

let {projects, selectedProject} = app;
let {all: list} = projects;

let showingSelector = false;
let main;

function onUpdate() {
	({all: list} = projects);
}

function onSelect() {
	({selectedProject} = app);
}

function toggle() {
	if (showingSelector) {
		close();
	} else {
		open();
	}
}

function bodyMousedown(e) {
	if (lineage(e.target).includes(main)) {
		return;
	}
	
	close();
}

function bodyKeydown(e) {
	if (e.key === "Escape") {
		e.preventDefault();
		e.stopPropagation();
		
		close();
	}
}

function close() {
	showingSelector = false;
	
	off(document.body, "mousedown", bodyMousedown);
	off(document.body, "keydown", bodyKeydown);
}

function open() {
	showingSelector = true;
	
	on(document.body, "mousedown", bodyMousedown);
	on(document.body, "keydown", bodyKeydown);
}

function getDisplayName(project) {
	return project.config.name || project.dirs.map(dir => replaceHomeDirWithTilde(dir.path)).join(", ");
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
	
	&:hover, &.showingSelector {
		border: 1px solid #c3c0bf;
	}
	
	&:not(.showingSelector):hover {
		background: linear-gradient(#f9f9f9 0%, #f1f0ed 100%);
	}
	
	&.showingSelector {
		background: linear-gradient(#f1f0ed 0%, #f9f9f9 100%);
	}
}

#selectorWrapper {
	position: absolute;
	z-index: 1;
}

#selector {
	position: absolute;
	top: 0;
	display: flex;
	max-height: 400px;
	border: var(--contextMenuBorder);
	border-radius: 2px;
	background: var(--contextMenuBackgroundColor);
}

#list {
}

#details {
	padding: 4px 5px;
}

.project {
	padding: 4px 5px;
	
	&:hover {
		background: var(--contextMenuHoverBackgroundColor);
	}
}
</style>

<div id="main" bind:this={main}>
	<div id="button" on:mousedown={toggle} class:showingSelector>
		{selectedProject?.name || "Project"}
	</div>
	<div id="selectorWrapper">
		<div id="selector" class:hide={!showingSelector}>
			<div id="list">
				{#each list as project}
					<div class="project">
						{getDisplayName(project)}
					</div>
				{/each}
			</div>
			<div id="details">
				details
			</div>
		</div>
	</div>
</div>
