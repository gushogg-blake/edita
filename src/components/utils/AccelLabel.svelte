<script>
import Accel from "components/utils/Accel.svelte";

export let label;
</script>

<label {...$$restProps}>
	<Accel {label}/>
</label>
