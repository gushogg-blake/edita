function split(str) {
	if (str.indexOf("-") !== -1) {
		return str.toLowerCase().split("-");
	} else if (str.indexOf("_") !== -1) {
		return str.toLowerCase().split("_");
	} else if (str.match(/[A-Z][a-z]/)) {
		let words = str.replace(/[A-Z]/g, (ch) => "-" + ch).toLowerCase().split("-");
		
		if (words[0] === "") {
			words.shift();
		}
		
		return words;
	} else {
		return [str];
	}
}

function capitalise(str) {
	return str[0].toUpperCase() + str.substr(1);
}

function camel(words) {
	return words[0] + words.slice(1).map(capitalise).join("");
}

function title(words) {
	return words.map(capitalise).join("");
}

function kebab(words) {
	return words.join("-");
}

function snake(words) {
	return words.join("_");
}

module.exports = {
	camel(str) {
		return camel(split(str));
	},
	
	title(str) {
		return title(split(str));
	},

	kebab(str) {
		return kebab(split(str));
	},

	snake(str) {
		return snake(split(str));
	},
	
	constant(str) {
		return snake(split(str)).toUpperCase();
	},
};
