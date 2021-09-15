/*
% is used instead of & as Svelte converts HTML entities to the
corresponding chars
*/

module.exports = function(label) {
	return label.match(/%(\w)/)?.[1].toLowerCase();
}
