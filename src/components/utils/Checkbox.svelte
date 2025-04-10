<script lang="ts">
import Accel from "components/utils/Accel.svelte";

let {
	value = $bindable(false),
	label,
	disabled = false,
	onchange = () => {},
} = $props();
</script>

<style lang="scss">
label {
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: .3em;
}
</style>

<label class:disabled>
	<input
		bind:checked={value}
		type="checkbox"
		onchange={() => onchange()}
		{disabled}
	>
	<Accel {label}/>
</label>
