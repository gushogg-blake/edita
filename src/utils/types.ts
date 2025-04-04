export type AsyncOrSync<T> = Promise<T> | T;

export type RecursivePartial<T> = {
	[K in keyof T]?: (
		T[K] extends (infer U)[]
		? RecursivePartial<U>[]
		: T[K] extends object | undefined ? RecursivePartial<T[K]> : T[K]
	);
};
