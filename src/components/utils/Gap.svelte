<script>
import _typeof from "utils/typeof";
import inlineStyle from "utils/dom/inlineStyle";

export let width = null;
export let height = null;
export let widthEm = null;
export let heightEm = null;

function getValue(pxOrNameValue, emValue) {
	if (emValue) {
		emValue += "em";
	}
	
	let value = pxOrNameValue || emValue;
	
	if (emValue) {
		return emValue;
	} else if (value === null) {
		return "100%";
	} else if (_typeof(value) === "Number") {
		return value;
	} else {
		return "--var(gap-" + value + ")";
	}
}

$: style = {
	width: getValue(width, widthEm),
	height: getValue(height, heightEm),
};
</script>

<div id="main" style={inlineStyle(style)}></div>
