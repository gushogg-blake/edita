<script lang="ts">
import {getContext, onMount} from "svelte";
import FileInput from "components/utils/FileInput.svelte";
import Spacer from "components/utils/Spacer.svelte";

let app = getContext("app");

let themes = $state(base.themes);
let theme = $state(base.theme);
let prefs = $state(base.prefs);

let langButton = $state();

function upload(files) {
	app.fileOperations.openFilesFromUpload(files);
}

function openLanguages() {
	platform.showContextMenuForElement(app, langButton, base.langs.all.filter(lang => !lang.util).map(function(lang) {
		return {
			label: lang.name,
			
			async onClick() {
				await app.fileOperations.newFile(lang);
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
		app.on("openLangSelector", openLanguages),
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
	<button onclick={() => app.functions._new()}>
		New
	</button>
	<button bind:this={langButton} title={base.findGlobalKeyComboFor("newWithLangSelector")} onmousedown={openLanguages}>
		Lang
	</button>
	{#if platform.isWeb}
		<FileInput multiple onupload={upload}/>
	{:else}
		<button onclick={() => app.functions.open()}>
			Open
		</button>
	{/if}
	<button onclick={() => app.functions.save()}>
		Save
	</button>
	<button onclick={() => app.panes.left.toggle()}>
		[
	</button>
	<button onclick={() => app.bottomPanes.toggleTools()}>
		_
	</button>
	<button onclick={() => app.bottomPanes.toggleOutput()}>
		_
	</button>
	<button onclick={() => app.panes.right.toggle()}>
		]
	</button>
	<Spacer/>
	{#if prefs.showThemeSelector}
		<select class="compact" value={prefs.theme} onchange={onSelectTheme}>
			{#each Object.entries(themes) as [key, _theme]}
				<option value={key}>{_theme.name}</option>
			{/each}
		</select>
	{/if}
</div>
