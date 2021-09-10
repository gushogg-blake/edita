<script>
export let path;

let node = platform.fs(path);
let {name} = node;
</script>

<style type="text/scss">
#main {
	display: flex;
}

#icon {
	width: 12px;
	height: 12px;
	border-radius: 3px;
	background: #eeeeee;
}
</style>

<div id="main">
	<div id="icon"></div>
	<div id="name">
		{name}
	</div>
</div>
