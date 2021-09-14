module.exports = function(label) {
	return label.match(/&(\w)/)?.[1].toLowerCase();
}
