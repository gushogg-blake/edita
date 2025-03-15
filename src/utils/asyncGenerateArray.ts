export default async function(asyncGenerator) {
	let results = [];
	
	for await (let result of asyncGenerator) {
		results.push(result);
	}
	
	return results;
}
