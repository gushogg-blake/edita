<script>
import {onMount, getContext} from "svelte";
import inlineStyle from "utils/dom/inlineStyle";
import FocusablePane from "./FocusablePane.svelte";
import DirectoryListing from "../DirectoryListing/DirectoryListing.svelte";

let app = getContext("app");

let dir = app.dir;

$: mainStyle = {
	width: 150,
};
</script>

<style type="text/scss">
@import "mixins/abs-sticky";

#main {
	position: relative;
	height: 100%;
}

#scroll {
	@include abs-sticky;
	
	--scrollbarBorderColor: var(--appBackgroundColor);
	
	overflow: auto;
}
</style>

<FocusablePane>
	<div id="main" style={inlineStyle(mainStyle)}>
		<div id="scroll">
			<DirectoryListing {dir}/>
		</div>
	</div>
</FocusablePane>
