<script>
import themeStyle from "components/themeStyle";
import MessageBox from "components/MessageBox.svelte";

export let app;

function respond({detail: response}) {
	app.respond(response);
	
	window.close();
}
</script>

<style lang="scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main" class="edita" style={themeStyle(base.theme.app)}>
	<MessageBox options={app.options} on:response={respond}/>
</div>
