let inlineStyle = require("utils/dom/inlineStyle");

module.exports = function(theme) {
	let {
		appBackgroundColor,
		toolbarBackgroundColor,
		scrollbarThumbWidth,
		scrollbarPadding,
		scrollbarWidth,
		scrollbarBackgroundColor,
		scrollbarBorder,
		scrollbarThumbBorder,
		scrollbarThumbBackground,
		inputBorder,
		appBorder,
		appFontFamily,
		appFontSize,
		appColor,
	} = theme;
	
	return inlineStyle({
		"--appBackgroundColor": appBackgroundColor,
		"--toolbarBackgroundColor": toolbarBackgroundColor,
		"--scrollbarThumbWidth": scrollbarThumbWidth,
		"--scrollbarPadding": scrollbarPadding,
		"--scrollbarWidth": scrollbarWidth,
		"--scrollbarBackgroundColor": scrollbarBackgroundColor,
		"--scrollbarBorder": scrollbarBorder,
		"--scrollbarThumbBorder": scrollbarThumbBorder,
		"--scrollbarThumbBackground": scrollbarThumbBackground,
		"--inputBorder": inputBorder,
		"--appBorder": appBorder,
		"--appFontFamily": appFontFamily,
		"--appFontSize": appFontSize,
		"--appColor": appColor,
	});
}