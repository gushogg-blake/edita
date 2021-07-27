<script>
import _typeof from "../../utils/typeof";
import inlineStyle from "../../utils/dom/inlineStyle";

export let width = null;
export let height = null;

function getValue(value) {
	if (value === null) {
		return "100%";
	} else if (_typeof(value) === "Number") {
		return value;
	} else {
		return "--var(gap-" + value + ")";
	}
}

$: style = {
	width: getValue(width),
	height: getValue(height),
};
</script>

<div id="main" style={inlineStyle(style)}></div>
