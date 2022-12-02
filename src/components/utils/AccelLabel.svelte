<script>
import _typeof from "utils/typeof";
import Accel from "components/utils/Accel.svelte";

export let label;

$: _for = $$props["for"];
$: forType = _typeof(_for) === "String" ? "id" : "component";

function click() {
	if (forType === "component") {
		_for.focus();
	}
}
</script>

<label for={forType === "id" ? _for : null} {...$$restProps} on:click={click}>
	<Accel {label}/>
</label>
