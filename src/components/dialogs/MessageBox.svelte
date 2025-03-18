<script lang="ts">
import themeStyle from "components/themeStyle";
import MessageBox from "components/MessageBox.svelte";

let {
	app,
} = $props();

function respond(response) {
	app.respond(response);
}
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	<MessageBox options={app.options} onresponse={respond}/>
</div>
