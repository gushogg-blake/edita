let inlineStyle = require("utils/dom/inlineStyle");

module.exports = function(prefs) {
	//let {
	//	
	//} = prefs.theme;
	
	return inlineStyle({
		"--appBackgroundColor": "#edecea",
		"--toolbarBackgroundColor": "#f2f2f0",
		"--scrollbarThumbWidth": "8px",
		"--scrollbarPadding": "3px",
		"--scrollbarWidth": "calc(var(--scrollbarThumbWidth) + var(--scrollbarPadding) * 2)",
		"--scrollbarBackgroundColor": "white",
		"--scrollbarBorder": "1px solid #bababa",
		"--scrollbarThumbBorder": "var(--scrollbarPadding) solid var(--scrollbarBackgroundColor)",
		"--scrollbarThumbBackground": "#B2B2B2",
		"--inputBorder": "1px solid #adaba6",
		"--appBorder": "1px solid #afacaa",
		"--appFontFamily": "\"Noto Sans\", \"Segoe UI\", \"San Francisco\", \"Helvetica Neue\", sans-serif",
		"--appFontSize": "12.5px",
		"--appColor": "#444444",
	});
}