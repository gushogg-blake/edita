/*
call asyncFn and then call run with the result, but only
if the asyncFn call was the latest one
*/

export default function() {
	let ids = {};
	
	return async function(name, asyncFn, run) {
		let id = (name in ids) ? ids[name] + 1 : 1;
		
		ids[name] = id;
		
		let result = await asyncFn();
		
		if (ids[name] !== id) {
			return;
		}
		
		delete ids[name];
		
		await run(result);
	}
}
