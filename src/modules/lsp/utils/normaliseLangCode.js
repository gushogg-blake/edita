let map = {
	"javascript": "typescript",
};

module.exports = function(langCode) {
	return map[langCode] || langCode;
}
