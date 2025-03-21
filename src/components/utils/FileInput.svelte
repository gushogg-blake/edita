<script lang="ts">
import bluebird from "bluebird";
import lid from "utils/lid";

let {
	multiple = false,
	onupload = () => {},
} = $props();

let id = lid();

function readFile(file) {
	return new Promise(function(resolve, reject) {
		let reader = new FileReader();
		
		reader.addEventListener("load", function() {
			resolve({
				name: file.name,
				contents: reader.result,
			});
		});
		
		reader.addEventListener("error", () => reject(reader.error));
		reader.addEventListener("abort", () => reject("Aborted"));
		
		reader.readAsText(file);
	});
}

async function upload(e) {
	let input = e.target;
	
	onupload(await bluebird.map(input.files, readFile));
	
	input.value = "";
}
</script>

<style lang="scss">
@use "utils";
</style>

<button>
	<input
		type="file"
		{id}
		class="hideInput"
		{multiple}
		onchange={upload}
	>
	<label for={id}>
		Open
	</label>
</button>
