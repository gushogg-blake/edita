<script lang="ts">
import Refactor from "components/Refactor/Refactor.svelte";

let {
	tab,
} = $props();

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
