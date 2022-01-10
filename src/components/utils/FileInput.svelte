<script>
import {createEventDispatcher} from "svelte";
import bluebird from "bluebird";
import lid from "utils/lid";

export let multiple = false;

let fire = createEventDispatcher();

let id = lid();

function readFile(file) {
	return new Promise(function(resolve, reject) {
		let reader = new FileReader();
		
		reader.addEventListener("load", function() {
			resolve({
				name: file.name,
				code: reader.result,
			});
		});
		
		reader.addEventListener("error", () => reject(reader.error));
		reader.addEventListener("abort", () => reject("Aborted"));
		
		reader.readAsText(file);
	});
}

async function upload(e) {
	let input = e.target;
	
	fire("upload", await bluebird.map(input.files, readFile));
	
	input.value = "";
}
</script>

<style type="text/scss">
@import "classes/hideInput";

button {
	color: var(--buttonColor);
	border: 0;
	border-radius: 3px;
	padding: .3em .7em;
	outline: none;
	background: var(--buttonBackgroundColor);
	
	&:active {
		box-shadow: inset 1px 1px 3px #00000025;
	}
}
</style>

<button>
	<input
		type="file"
		{id}
		class="hideInput"
		{multiple}
		on:change={upload}
	>
	<label for={id}>
		Open
	</label>
</button>
