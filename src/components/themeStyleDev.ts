let mapObject = require("utils/mapObject");
let _typeof = require("utils/typeof");
let inlineStyle = require("utils/dom/inlineStyle");

/*
write theme variables to the node's style (and update them when the
theme is switched) and then poll them and write them back to the theme.
this lets you open dev tools, modify the variables and see the results
for e.g. tweaking colors.

we're only interested in canvas-related values like margin style and
syntax highlighting colors for this as app variables are used as CSS
variables directly, so changing them in dev tools will update
automatically.
*/

function _getVariables(values, path=[]) {
	let vars = {};
	
	for (let [key, value] of Object.entries(values)) {
		if (_typeof(value) === "Object") {
			vars = {...vars, ..._getVariables(value, [...path, key])};
		} else {
			vars[["--dev", ...path, key].join("_")] = value;
		}
	}
	
	return vars;
}

function getVariables(theme, selectedTab, path=[]) {
	let {editor, langs} = theme;
	
	let values = {
		editor,
	};
	
	if (selectedTab?.isEditor) {
		values.langs = {};
		
		for (let {lang} of selectedTab.editor.document.scopes) {
			values.langs[lang.code] = mapObject(langs[lang.code], function(style) {
				return {
					color: style.color,
				};
			});
		}
	}
	
	return _getVariables(values);
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

function getThemeValues(node) {
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

export default function(node, {app, update}) {
	function updateTheme() {
		update(getThemeValues(node));
	}
	
	function updateStyle() {
		node.style = inlineStyle(getVariables(base.theme, app.selectedTab));
	}
	
	updateStyle();
	updateTheme();
	
	let timer = setInterval(updateTheme, 300);
	
	let teardown = [
		function() {
			clearInterval(timer);
		},
		
		base.on("prefsUpdated", updateStyle),
		app.on("selectTab", updateStyle),
	];
	
	return {
		destroy() {
			for (let fn of teardown) {
				fn();
			}
		},
	};
}
