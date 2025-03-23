/*
Promise that can be resolved/rejected from outside
*/

type PromiseWithMethods<T> = Promise<T> & {
	resolve(value: any);
	reject(error: any);
};

export default function<T>(): PromiseWithMethods<T> {
	let resolve;
	let reject;
	
	let promise = new Promise(function(res, rej) {
		resolve = res;
		reject = rej;
	}) as PromiseWithMethods<T>;
	
	promise.resolve = resolve;
	promise.reject = reject;
	
	return promise;
}
