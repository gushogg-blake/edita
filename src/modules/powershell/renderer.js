let {ipcRenderer: ipc} = window.require("electron-better-ipc");
let normaliseString = require("../../utils/normaliseString");

class PowerShell {
	constructor(id) {
		this.id = id;
		
		[
			"addCommand",
			"invoke",
		].forEach(m => this[m] = (...args) => this.call(m, ...args));
	}
	
	call(fn, ...args) {
		return ipc.callMain("powershell/call", [this.id, fn, ...args]);
	}
	
	run(commands) {
		let lines = normaliseString(commands).split("\n");
		
		for (let line of lines) {
			this.addCommand(line);
		}
		
		return this.invoke();
	}
	
	destroy() {
		return ipc.callMain("powershell/destroy", [this.id]);
	}
}

module.exports = async function() {
	return new PowerShell(await ipc.callMain("powershell/create"));
}
