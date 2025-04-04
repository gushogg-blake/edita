type MapProperties<T, NewType> = {
	[K in keyof T]: NewType;
};

export default function<T, NewType>(
	obj: T,
	fn: (value: T[keyof T], key: keyof T) => NewType,
): MapProperties<T, NewType> {
	let result: any = {};
	
	for (let k in obj) {
		result[k] = fn(obj[k], k);
	}
	
	return result;
}
