import child_process from "child_process";

export * from "utils";
export {default as fs} from "./fs";

export function cmdSync(c) {
	return child_process.execSync(c).toString();
}

export function spawn(cmd, args) {
	return new Promise((resolve, reject) => {
		let childProcess = child_process.spawn(cmd, args);
		
		childProcess.on("spawn", () => resolve(childProcess));
		childProcess.on("error", reject);
	});
}

export async function readStdin() {
	let chunks = [];
	
	for await (let chunk of process.stdin) {
		chunks.push(chunk);
	}
	
	return Buffer.concat(chunks).toString();
}
