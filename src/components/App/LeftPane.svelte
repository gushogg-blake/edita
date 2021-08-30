<script>
import {onMount, getContext} from "svelte";
import FocusablePane from "./FocusablePane.svelte";

let app = getContext("app");


</script>

<style type="text/scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<FocusablePane>
	<div id="main">
		left
	</div>
</FocusablePane>
