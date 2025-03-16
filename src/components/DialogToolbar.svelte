<script lang="ts">
let {
	title = "",
} = $props();
</script>

<style lang="scss">
#main {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 3px;
	background: var(--toolbarBackground);
}

#title {
	font-weight: bold;
	text-align: center;
	flex-grow: 1;
}
</style>

<div id="main">
	<div id="title">
		{title}
	</div>
	<div id="buttons">
		<button onclick={() => fire("close")}>x</button>
	</div>
</div>
