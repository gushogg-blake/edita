<script lang="ts">
import _typeof from "utils/typeof";
import Accel from "components/utils/Accel.svelte";

let props = $props();

let _for = $derived(props["for"]);
let forType = $derived(_typeof(_for) === "String" ? "id" : "component");

function click() {
	if (forType === "component") {
		_for.focus();
	}
}
</script>

<label for={forType === "id" ? _for : null} {...props} onclick={click}>
	<Accel {props.label}/>
</label>
