let mapArrayToObject = require("utils/mapArrayToObject");
let _typeof = require("utils/typeof");
let inlineStyle = require("utils/dom/inlineStyle");

/*
write theme variables to the node's style (and update them when the
theme is switched) and then poll them and write them back to the theme.
this lets you open dev tools, modify the variables and see the results
for e.g. tweaking colors.

for non-editor variables this is unnecessary and you can just change
the variables on the main app div instead, but editors read the values
directly from the theme to use in canvas drawing so won't get the
updates from that.
*/

function getVariables(theme, path=[]) {
	let vars = {};
	
	for (let [key, value] of Object.entries(theme)) {
		if (_typeof(value) === "Object") {
			vars = {...vars, ...getVariables(value, [...path, key])};
		} else {
			vars[["--dev", ...path, key].join("_")] = value;
		}
	}
	
	return vars;
}

function addValueToTheme(obj, path, value) {
	for (let p of path.slice(0, path.length - 1)) {
		if (!(p in obj)) {
			obj[p] = {};
		}
		
		obj = obj[p];
	}
	
	obj[path.at(-1)] = value;
}

function getTheme(node) {
	let vars = [];
	let style = getComputedStyle(node);
	
	for (let i = 0; i < node.style.length; i++) {
		let key = node.style[i];
		
		if (key.startsWith("--dev_")) {
			vars.push({
				path: key.substr("--dev_".length).split("_"),
				value: style.getPropertyValue(key).trim(),
			});
		}
	}
	
	let theme = {};
	
	for (let {path, value} of vars) {
		addValueToTheme(theme, path, value);
	}
	
	return theme;
}

module.exports = function(node, update) {
	function updateTheme() {
		update(getTheme(node));
	}
	
	function updateStyle() {
		node.style = inlineStyle(getVariables(base.theme));
	}
	
	updateStyle();
	updateTheme();
	
	let timer = setInterval(updateTheme, 300);
	
	let teardown = [
		function() {
			clearInterval(timer);
		},
		
		base.on("prefsUpdated", updateStyle),
	];
	
	return {
		destroy() {
			for (let fn of teardown) {
				fn();
			}
		},
	};
}
