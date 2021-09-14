<script>
export let label;
</script>

<span>
	{@html label.replace(/&(\w)/, "<u>$1</u>")}
</span>
