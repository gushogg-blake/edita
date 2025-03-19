<script lang="ts">
import {onMount, setContext, getContext, tick} from "svelte";
import themeStyle from "components/themeStyle";

let {
	app,
	Component,
} = $props();
</script>

<style lang="scss">
#main {
	width: 100vw;
	height: 100vh;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	<Component {app}/>
</div>
