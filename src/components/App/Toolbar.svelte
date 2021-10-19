<script>
import {getContext} from "svelte";
import FileInput from "components/utils/FileInput.svelte";

let app = getContext("app");

function upload({detail: files}) {
	app.openFilesFromUpload(files);
}

function openLanguages(e) {
	debugger
	app.showContextMenuForElement(e.target, base.langs.all.map(function(lang) {
		return {
			label: lang.name,
			
			onClick() {
				app.newFile(lang);
			},
		};
	}));
}
</script>

<style type="text/scss">
#main {
	padding: 3px;
	background: #f2f2f0;
	//background: white;
}

button {
	color: #333333;
	border: 0;
	border-radius: 3px;
	padding: .3em .7em;
	outline: none;
	
	&:active {
		box-shadow: inset 1px 1px 3px #00000025;
	}
}
</style>

<div id="main" on:mousedown={() => app.focusSelectedTabAsync()}>
	<button on:click={() => app.functions._new()}>
		New
	</button>
	<button on:mousedown={openLanguages}>
		Lang
	</button>
	{#if platform.useFileUploader}
		<FileInput on:upload={upload}/>
	{:else}
		<button on:click={() => app.functions.open()}>
			Open
		</button>
	{/if}
	<button on:click={() => app.functions.save()}>
		Save
	</button>
	<button on:click={() => app.togglePane("left")}>
		[
	</button>
	<button on:click={() => app.togglePane("bottom")}>
		_
	</button>
	<button on:click={() => app.togglePane("right")}>
		]
	</button>
</div>
