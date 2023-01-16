<script>
import {onMount} from "svelte";
import RefactorPreview from "components/Refactor/RefactorPreview.svelte";

export let tab;

let {refactorPreview} = tab;

onMount(function() {
	let teardown = [
		
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
	width: 100%;
	height: 100%;
}
</style>

<div id="main">
	<RefactorPreview {refactorPreview}/>
</div>
