<script>
import bluebird from "bluebird";
import FileEntry from "./FileEntry.svelte";

export let dir;
export let level = 0;

let node = platform.fs(dir);
let {name} = node;
let showEntry = level > 0;
let expanded = level === 0 ? true : false; // TODO get from store
let entries = [];
let loaded = false;

$: dirs = entries.filter(n => n.isDir);
$: files = entries.filter(n => !n.isDir);

async function update() {
	entries = await bluebird.map(node.ls(), async function(node) {
		return {
			path: node.path,
			isDir: await node.isDir(),
		};
	});
	
	loaded = true;
	
	console.log(entries);
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
}

#icon {
	width: 12px;
	height: 12px;
	border-radius: 3px;
	background: #b9d7f1;
}

#entries {
	
}

.indent {
	margin-left: 1.2em;
}
</style>

<div id="main">
	{#if showEntry}
		<div id="entry">
			<div id="actions">
				<button on:click={toggle}>{expanded ? "-" : "+"}</button>
			</div>
			<div id="icon"></div>
			<div id="name">
				{name}
			</div>
		</div>
	{/if}
	{#if expanded}
		<div id="entries" class:indent={level !== 0}>
			{#each dirs as entry}
				<svelte:self dir={entry.path} level={level + 1}/>
			{/each}
			{#each dirs as entry}
				<FileEntry path={entry.path} level={level + 1}/>
			{/each}
		</div>
	{/if}
</div>
