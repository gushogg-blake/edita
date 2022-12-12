<script>
import {getContext, onMount} from "svelte";
import FileInput from "components/utils/FileInput.svelte";
import Spacer from "components/utils/Spacer.svelte";

let app = getContext("app");

let {
	themes,
	theme,
	prefs,
} = base;

function upload({detail: files}) {
	app.openFilesFromUpload(files);
}

function openLanguages(e) {
	platform.showContextMenuForElement(app, e.target, base.langs.all.map(function(lang) {
		return {
			label: lang.name,
			
			onClick() {
				app.newFile(lang);
			},
		};
	}));
}

function onSelectTheme(e) {
	base.setPref("theme", e.target.value);
}

function onThemeUpdated() {
	({
		themes,
		theme,
		prefs,
	} = base);
}

onMount(function() {
	let teardown = [
		base.on("themeUpdated", onThemeUpdated),
	];
	
	return function() {
		for (let fn of teardown) {
			fn();
		}
	}
});
</script>

<style lang="scss">
#main {
	--buttonBackground: transparent;
	--buttonBorder: 0;
	
	display: flex;
	gap: 3px;
	padding: 3px;
	background: var(--toolbarBackground);
}
</style>

<div id="main">
	<button on:click={() => app.functions._new()}>
		New
	</button>
	<button on:mousedown={openLanguages}>
		Lang
	</button>
	{#if platform.isWeb}
		<FileInput multiple on:upload={upload}/>
	{:else}
		<button on:click={() => app.functions.open()}>
			Open
		</button>
	{/if}
	<button on:click={() => app.functions.save()}>
		Save
	</button>
	<button on:click={() => app.panes.left.toggle()}>
		[
	</button>
	<button on:click={() => app.bottomPanes.toggleTools()}>
		_
	</button>
	<button on:click={() => app.bottomPanes.toggleOutput()}>
		_
	</button>
	<button on:click={() => app.panes.right.toggle()}>
		]
	</button>
	<Spacer/>
	{#if prefs.showThemeSelector}
		<select class="compact" value={prefs.theme} on:change={onSelectTheme}>
			{#each Object.entries(themes) as [key, _theme]}
				<option value={key}>{_theme.name}</option>
			{/each}
		</select>
	{/if}
</div>
