<script>
export let label;
</script>

{@html label.replace(/&(\w)/, "<u>$1</u>")}
