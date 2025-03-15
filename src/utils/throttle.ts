export default function(fn, minDelay) {
	let timer = null;
	let lastCall = null;
	
	function run() {
		fn();
		
		lastCall = Date.now();
		timer = null;
	}
	
	return function() {
		let timeSinceLastCall = lastCall ? Date.now() - lastCall : Infinity;
		
		if (timeSinceLastCall < minDelay) {
			if (!timer) {
				timer = setTimeout(run, minDelay - timeSinceLastCall);
			}
		} else {
			run();
		}
	}
}
