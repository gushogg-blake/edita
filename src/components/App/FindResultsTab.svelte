<script lang="ts">
import FindResults from "components/FindResults.svelte";

let {
	tab,
} = $props();

let {findResults} = tab;
</script>

<FindResults {findResults}/>
