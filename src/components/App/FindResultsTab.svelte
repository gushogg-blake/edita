<script>
import FindResults from "components/FindResults.svelte";

export let tab;

let {findResults} = tab;
</script>

<FindResults {findResults}/>
