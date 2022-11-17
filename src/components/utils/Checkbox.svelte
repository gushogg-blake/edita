<script>
import Accel from "components/utils/Accel.svelte";

export let checked = false;
export let label;
export let disabled = false;
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
		bind:checked
		type="checkbox"
		on:change
		{disabled}
	>
	<Accel {label}/>
</label>
