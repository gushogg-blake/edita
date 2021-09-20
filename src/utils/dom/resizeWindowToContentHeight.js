let sleep = require("utils/sleep");

module.exports = function() {
	let firstResize = true;
	
	return async function(contentHeight) {
		let {body} = document;
		
		if (firstResize) {
			await sleep(50);
		}
		
		window.resizeBy(0, -(body.offsetHeight - contentHeight));
		
		while (body.scrollHeight > body.offsetHeight) {
			window.resizeBy(0, 1);
			
			await sleep(1);
		}
		
		firstResize = false;
	}
}
