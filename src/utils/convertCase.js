function split(str) {
	if (str.indexOf("-") !== -1) {
		return str.split("-");
	} else if (str.indexOf("_") !== -1) {
		return str.split("_");
	} else {
		return str.replace(/([A-Z])/g, (_, ch) => "-" + ch.toLowerCase()).split("-").filter(Boolean);
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
};
