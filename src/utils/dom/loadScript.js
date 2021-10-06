module.exports = function(url, callback) {
	return new Promise(function(resolve, reject) {
		let script = document.createElement("script");
		
		script.async = true;
		script.onload = resolve;
		script.onerror = reject;
		script.src = url;
		
		document.getElementsByTagName("head")[0].appendChild(script);
	});
}
