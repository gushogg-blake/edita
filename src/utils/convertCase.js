function split(str) {
	if (str.indexOf("-") !== -1) {
		return str.split("-");
	} else if (str.indexOf("_") !== -1) {
		return str.split("_");
	} else if (str.match(/[A-Z][a-z]/)) {
		return str.replace(/[A-Z]/g, (ch) => "-" + ch).split("-").filter(Boolean);
	} else {
		return [str];
	}
}

function capitalise(word) {
	return word[0].toUpperCase() + word.substr(1).toLowerCase();
}

module.exports = {
	camel(str) {
		let words = split(str);
		
		return words[0].toLowerCase() + words.slice(1).map(capitalise).join("");
	},
	
	title(str) {
		return split(str).map(capitalise).join("");
	},

	kebab(str) {
		return split(str).join("-").toLowerCase();
	},

	snake(str) {
		return split(str).join("_").toLowerCase();
	},
	
	constant(str) {
		return split(str).join("_").toUpperCase();
	},
};
