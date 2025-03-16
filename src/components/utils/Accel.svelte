<script lang="ts">
let {
	label,
} = $props();
</script>

<!-- % is used instead of & as Svelte converts HTML entities to their corresponding chars -->

<span>
	{@html label.replace(/%(\w)/, "<u>$1</u>")}
</span>
