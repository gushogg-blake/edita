<script lang="ts">
import _typeof from "utils/typeof";
import inlineStyle from "utils/dom/inlineStyle";

let {
	width = null,
	height = null,
	widthEm = null,
	heightEm = null,
} = $props();

function getValue(pxOrNameValue, emValue) {
	if (emValue) {
		return emValue + "em";
	}
	
	let value = pxOrNameValue;
	
	if (value === null) {
		return "100%";
	} else if (_typeof(value) === "Number") {
		return value;
	} else {
		return "--var(gap-" + value + ")";
	}
}

let style = $derived({
	width: getValue(width, widthEm),
	height: getValue(height, heightEm),
});
</script>

<div id="main" style={inlineStyle(style)}></div>
