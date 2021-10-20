<script>
import MessageBox from "components/MessageBox.svelte";

export let app;

function respond({detail: response}) {
	app.respond(response);
	
	window.close();
}
</script>

<style type="text/scss">
#main {
	width: 100%;
	height: 100%;
}
</style>

<div id="main">
	<MessageBox options={app.options} on:response={respond}/>
</div>
