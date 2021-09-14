let queryString = require("query-string");

module.exports = function() {
	return JSON.parse(queryString.parse(location.search).options);
}
