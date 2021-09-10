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
	display: grid;
	grid-template-rows: auto 1fr;
	height: 100%;
}

#top {
	padding: 3px;
}

#list {
	position: relative;
}

#scroll {
	@include abs-sticky;
	
	--scrollbarBorderColor: var(--appBackgroundColor);
	
	overflow: auto;
}
</style>

<FocusablePane>
	<div id="main" style={inlineStyle(mainStyle)}>
		<div id="top">
			top
		</div>
		<div id="list">
			<div id="scroll">
				<DirectoryListing {dir}/>
			</div>
		</div>
	</div>
</FocusablePane>
