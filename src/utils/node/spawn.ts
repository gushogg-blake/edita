import {spawn} from "child_process";

export default function(cmd, args) {
	return new Promise((resolve, reject) => {
		let childProcess = spawn(cmd, args);
		
		childProcess.on("spawn", () => resolve(childProcess));
		childProcess.on("error", reject);
	});
}
