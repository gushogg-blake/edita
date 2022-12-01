<script>
import Refactor from "components/Refactor.svelte";

export let tab;

let {refactor} = tab;
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main">
	<Refactor {refactor}/>
</div>
