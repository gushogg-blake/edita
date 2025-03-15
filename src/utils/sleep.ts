export default function(ms) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, ms);
	});
}
