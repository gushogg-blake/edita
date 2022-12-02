<script>
import {onMount, createEventDispatcher} from "svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Gap from "components/utils/Gap.svelte";
import Editor from "components/Editor/Editor.svelte";

export let refactor;

let fire = createEventDispatcher();

let matchedEditor;
let refactoredEditor;

let preview = {
	path: null,
	matched: "",
	refactored: "",
};

function onOptionsChange() {
	
}

onMount(function() {
	let teardown = [
		refactor.on("optionsChanged", onOptionsChange),
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
	
}
</style>

<div id="main">
	<div>
		<select bind:value={preview.path}>
		</select>
	</div>
	
	<AccelLabel for={matchedEditor} label="M%atched"/>
	<Gap height={3}/>
	<div class="editor">
		<Editor bind:this={matchedEditor} bind:value={preview.matched}/>
	</div>
	<Gap heightEm={1}/>
	<AccelLabel for={refactoredEditor} label="Refa%ctored"/>
	<Gap height={3}/>
	<div class="editor">
		<Editor bind:this={refactoredEditor} bind:value={preview.refactored}/>
	</div>
</div>
