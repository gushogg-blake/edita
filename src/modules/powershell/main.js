let RealShell = require("node-powershell");
let MockShell = require("./MockShell");
let lid = require("../../utils/lid");

let Shell = process.platform === "win32" ? RealShell : MockShell;

let instances = {};

module.exports = {
	create() {
		let id = lid();
		
		let ps = new Shell({
			executionPolicy: "Bypass",
			noProfile: true,
		});
		
		instances[id] = ps;
		
		return id;
	},
	
	call(id, fn, ...args) {
		return instances[id][fn](...args);
	},
	
	async destroy() {
		await instances[id].dispose();
		
		delete instances[id];
	},
};
