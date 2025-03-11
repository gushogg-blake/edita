<script>
import {onMount, setContext, getContext, createEventDispatcher, tick} from "svelte";
import getKeyCombo from "utils/getKeyCombo";
import accels from "components/actions/accels";
import Gap from "components/utils/Gap.svelte";
import Spacer from "components/utils/Spacer.svelte";
import Accel from "components/utils/Accel.svelte";
import AccelLabel from "components/utils/AccelLabel.svelte";
import Checkbox from "components/utils/Checkbox.svelte";

let fire = createEventDispatcher();

let app = getContext("app");

let {fileFilters} = app;
</script>

<style lang="scss">
#main {
	border-top: var(--appBorder);
}
</style>

<div id="main">
	<!--<Checkbox bind:value={formOptions.showResults} label="Sh%ow results"/>-->
</div>
