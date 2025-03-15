export default function(array, fn) {
	let result = {};
	
	for (let i = 0; i < array.length; i++) {
		let [key, value] = fn(array[i], i, array);
		
		result[key] = value;
	}
	
	return result;
}
