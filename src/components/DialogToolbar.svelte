<script lang="ts">
let {
	title = "",
	onclose = () => {},
} = $props();

export function setTitle(value) {
	title = value;
}
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
		<button onclick={() => onclose()}>x</button>
	</div>
</div>
