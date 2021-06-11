module.exports = function(json) {
	try {
		return JSON.parse(json);	
	} catch (e) {
		return null;
	}
}
