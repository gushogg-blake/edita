module.exports = function(cursor) {
	if (cursor.gotoFirstChild()) {
		return true;
	}
	
	if (cursor.gotoNextSibling()) {
		return true;
	}
	
	while (cursor.gotoParent()) {
		if (cursor.gotoNextSibling()) {
			return true;
		}
	}
	
	return false;
}
