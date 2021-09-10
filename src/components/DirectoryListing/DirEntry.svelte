<script>
import bluebird from "bluebird";

export let entry;
export let isRoot = false;

let {path, isDir} = entry;
let node = platform.fs(path);
let {name} = node;
let showEntry = !isRoot;
let expanded = isRoot ? true : false; // TODO get from store
let entries = [];
let loaded = false;

$: dirs = entries.filter(e => e.isDir);
$: files = entries.filter(e => !e.isDir);

async function update() {
	entries = await bluebird.map(node.ls(), async function(node) {
		return {
			path: node.path,
			isDir: await node.isDir(),
		};
	});
	
	loaded = true;
}

function toggle() {
	expanded = !expanded;
	
	if (!loaded) {
		update();
	}
}

if (expanded) {
	update();
}
</script>

<style type="text/scss">
#main {
	
}

#entry {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 2px 0;
}

#icon {
	flex-shrink: 0;
	width: 12px;
	height: 12px;
	border-radius: 3px;
}

.dirIcon {
	background: #b9d7f1;
}

.fileIcon {
	background: #fbfbfb;
}

#entries {
	
}

.indent {
	margin-left: 1.2em;
}

button {
	font-size: .9em;
	border: 1px solid #bbbbbb;
	padding: 1px 3px;
	background: white;
}
</style>

<div id="main">
	{#if showEntry}
		<div id="entry">
			{#if isDir}
				<div id="actions">
					<button on:click={toggle}>{expanded ? "-" : "+"}</button>
				</div>
			{/if}
			<div id="icon" class:dirIcon={isDir} class:fileIcon={!isDir}></div>
			<div id="name">
				{name}
			</div>
		</div>
	{/if}
	{#if expanded}
		<div id="entries" class:indent={!isRoot}>
			{#each dirs as entry}
				<svelte:self {entry}/>
			{/each}
			{#each files as entry}
				<svelte:self {entry}/>
			{/each}
		</div>
	{/if}
</div>
