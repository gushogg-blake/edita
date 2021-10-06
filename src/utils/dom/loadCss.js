module.exports = function(url, callback) {
	return new Promise(function(resolve, reject) {
		let link = document.createElement("link");
		
		link.rel = "stylesheet";
		link.onload = resolve;
		link.onerror = reject;
		link.href = url;
		
		document.getElementsByTagName("head")[0].appendChild(link);
	});
}
