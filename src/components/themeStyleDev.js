let mapArrayToObject = require("utils/mapArrayToObject");
let _typeof = require("utils/typeof");
let inlineStyle = require("utils/dom/inlineStyle");

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

module.exports = function(node, {theme, update}) {
	function updateTheme() {
		update(getTheme(node));
	}
	
	node.style = inlineStyle(getVariables(theme));
	
	updateTheme();
	
	let timer = setInterval(updateTheme, 500);
	
	return {
		destroy() {
			clearInterval(timer);
		},
	};
}
