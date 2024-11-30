/*
Generate locally unique ids
*/

let id = Date.now();

module.exports = function() {
	return (++id).toString(36);
}
