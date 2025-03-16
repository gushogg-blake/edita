<script lang="ts">
import {onMount, getContext} from "svelte";
import {on, off} from "utils/dom/domEvents";
import lineage from "utils/dom/lineage";

let app = getContext("app");

let {projects} = app;
let {all: list, selectedProject} = $state(projects);

let viewingProject = $state(selectedProject);
let showingSelector = $state(false);
let quickSelectMode;
let main = $state();

function onUpdate() {
	({all: list} = projects);
}

function onSelect() {
	({selectedProject} = projects);
}

function buttonMousedown() {
	if (showingSelector) {
		close();
	} else {
		quickSelectMode = true;
		
		open();
	}
}

function buttonClick() {
	quickSelectMode = false;
}

function projectMouseup(project) {
	if (!quickSelectMode) {
		return;
	}
	
	viewProject(project);
	
	quickSelectMode = false;
}

function projectClick(project) {
	viewProject(project);
}

function newProjectClick() {
	newProject();
}

function newProjectMouseup() {
	if (!quickSelectMode) {
		return;
	}
	
	newProject();
	
	quickSelectMode = false;
}

async function newProject() {
	let dirs = await platform.chooseDir();
	
	if (dirs.length === 0) {
		return;
	}
	
	try {
		let project = await projects.createFromDirs(dirs);
		
		selectProject(project);
	} catch (e) {
		console.error(e);
		
		alert(e.message);
	}
}

function viewProject(project) {
	viewingProject = project;
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
	viewingProject = selectedProject;
	
	on(document.body, "mousedown", bodyMousedown);
	on(document.body, "keydown", bodyKeydown);
}

function getLabel(project) {
	return project.config.name || project.dirs.map(dir => platform.fs(dir).name).join(", ");
}

function getFullName(project) {
	return project.config.name || project.dirs.map(dir => platform.fs(dir).homePath).join(", ");
}

onMount(function() {
	let teardown = [
		projects.on("update", onUpdate),
		projects.on("select", onSelect),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
@use "utils";

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
	overflow: hidden;
	background: var(--contextMenuBackground);
}

#list {
	width: 180px;
}

#details {
	display: grid;
	grid-template-rows: 1fr auto;
	width: 320px;
	border-left: var(--contextMenuBorder);
	
	> div {
		padding: 4px 5px;
	}
}

#actions {
	border-top: var(--contextMenuBorder);
}

.project {
	padding: 4px 5px;
	
	&:hover {
		color: var(--contextMenuHoverColor);
		background: var(--contextMenuHoverBackground);
	}
}
</style>

<div id="main" bind:this={main}>
	<div
		id="button"
		onmousedown={buttonMousedown}
		onclick={buttonClick}
		class:showingSelector
		title={selectedProject ? getFullName(selectedProject) : ""}
	>
		{selectedProject ? getLabel(selectedProject) : "Projects"}
	</div>
	<div id="selectorWrapper">
		<div id="selector" class:hide={!showingSelector}>
			<div id="list">
				{#each list as project}
					<div
						class="project"
						onmouseup={() => projectMouseup(project)}
						onclick={() => projectClick(project)}
					>
						{getLabel(project)}
					</div>
				{/each}
				{#if platform.chooseDir}
					<div
						class="project"
						onmouseup={newProjectMouseup}
						onclick={newProjectClick}
					>
						New project
					</div>
				{/if}
			</div>
			{#if viewingProject}
				<div id="details">
					<div>
						{getFullName(viewingProject)}
					</div>
					<div id="actions">
						<!--<button onclick={() => selectAndClose(viewingProject)}>Select</button>-->
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
