let regexMatch = require("utils/regexMatch");

function split(str) {
	let prefix = regexMatch(str, /^[_\W]+/);
	let suffix = regexMatch(str, /[_\W]+$/);
	
	str = str.substring(prefix.length, str.length - suffix.length);
	
	let words;
	
	if (str.indexOf("-") !== -1) {
		words = str.split("-");
	} else if (str.indexOf("_") !== -1) {
		words = str.split("_");
	} else if (str.match(/[A-Z][a-z]/)) {
		words = str.replace(/[A-Z]/g, (ch) => "-" + ch).split("-").filter(Boolean);
	} else {
		words = [str];
	}
	
	return {prefix, suffix, words};
}

function capitalise(word) {
	return word[0].toUpperCase() + word.substr(1).toLowerCase();
}

let convertWords = {
	camel(words) {
		return words[0].toLowerCase() + words.slice(1).map(capitalise).join("");
	},
	
	title(words) {
		return words.map(capitalise).join("");
	},

	kebab(words) {
		return words.join("-").toLowerCase();
	},

	snake(words) {
		return words.join("_").toLowerCase();
	},
	
	constant(words) {
		return words.join("_").toUpperCase();
	},
};

function convert(str, type) {
	let {prefix, suffix, words} = split(str);
	
	return prefix + convertWords[type](words) + suffix;
}

module.exports = {
	camel(str) {
		return convert(str, "camel");
	},
	
	title(str) {
		return convert(str, "title");
	},

	kebab(str) {
		return convert(str, "kebab");
	},

	snake(str) {
		return convert(str, "snake");
	},
	
	constant(str) {
		return convert(str, "constant");
	},
};
