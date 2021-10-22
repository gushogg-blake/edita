let Evented = require("../utils/Evented");
let lid = require("../utils/lid");
let spawn = require("../utils/spawn");
let promiseWithMethods = require("../utils/promiseWithMethods");
let fs = require("./fs");

let nodeModules = fs(__dirname, "..", "..", "..", "..", "node_modules");

let cmds = {
	javascript: ["node", nodeModules.child("typescript-language-server", "lib", "cli.js").path],
};

class LspServer extends Evented {
	constructor(id, langCode) {
		this.id = id;
		this.langCode = langCode;
		this.requestPromises = {};
	}
	
	async init(capabilities, initOptions, workspaceFolders) {
		let [cmd, ...args] = cmds[this.langCode];
		
		this.process = await spawn(cmd, args);
		
		this.process.on("data", this.onData.bind(this));
		this.process.on("exit", this.onExit.bind(this));
		
		let {
			capabilities: serverCapabilities,
		} = await this.request("initialize", {
			processId: process.pid,
			capabilities,
			initializationOptions: initOptions,
			workspaceFolders,
		});
		
		return 
	}
	
	request(method, params) {
		let id = lid();
		
		let json = JSON.stringify({
			id,
			jsonrpc: "2.0",
			method,
			params,
		});
		
		this.process.stdio.write("Content-Length: " + json.length + "\r\n\r\n" + json);
		
		let promise = promiseWithMethods();
		
		this.requestPromises[id] = promise;
		
		return promise;
	}
	
	onData(data) {
		console.log(data);
	}
	
	onExit(code) {
		this.fire("exit");
	}
}

module.exports = LspServer;
