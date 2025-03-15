let {spawn} = require("child_process");

module.exports = function(cmd, args) {
	return new Promise((resolve, reject) => {
		let childProcess = spawn(cmd, args);
		
		childProcess.on("spawn", () => resolve(childProcess));
		childProcess.on("error", reject);
	});
}
