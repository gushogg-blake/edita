export default function<T>(obj, fns: T): T {
	let result: any = {};
	
	for (let [n, fn] of Object.entries(fns)) {
		result[n] = fn.bind(obj);
	}
	
	return result;
}
