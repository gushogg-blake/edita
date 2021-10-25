let Evented = require("../utils/Evented");
let lid = require("../utils/lid");
let spawn = require("../utils/spawn");
let promiseWithMethods = require("../utils/promiseWithMethods");
let fs = require("./fs");

let nodeModules = fs(__dirname, "..", "..", "..", "..", "..", "node_modules");

let cmds = {
	javascript: [
		"node", 
		nodeModules.child("typescript-language-server", "lib", "cli.js").path, 
		"--stdio", 
		"--log-level=4", 
		"--tsserver-path=" + nodeModules.child("typescript/lib/tsserver.js").path,
		"--tsserver-log-file=/home/gus/logs.txt",
	],
};

class LspServer extends Evented {
	constructor(id, langCode) {
		super();
		
		this.id = id;
		this.langCode = langCode;
		this.requestPromises = {};
	}
	
	async init(capabilities, initOptions, workspaceFolders) {
		let [cmd, ...args] = cmds[this.langCode];
		
		this.process = await spawn(cmd, args);
		
		this.process.stdout.on("data", this.onData.bind(this));
		this.process.stderr.on("data", this.onData.bind(this));
		
		this.process.on("exit", this.onExit.bind(this));
		
		let {
			capabilities: serverCapabilities,
		} = await this.request("initialize", {
			processId: process.pid,
			capabilities,
			initializationOptions: initOptions,
			rootUri: null,
			workspaceFolders,
		});
		
		return serverCapabilities;
	}
	
	request(method, params) {
		let id = lid();
		
		let json = JSON.stringify({
			id,
			jsonrpc: "2.0",
			method,
			params,
		});
		
		console.log("Content-Length: " + json.length + "\r\n\r\n" + json);
		
		this.process.stdin.write("Content-Length: " + json.length + "\r\n\r\n" + json + "\r\n");
		
		let promise = promiseWithMethods();
		
		this.requestPromises[id] = promise;
		
		return promise;
	}
	
	onData(data) {
		console.log(data.toString());
	}
	
	onExit(code) {
		console.error(code);
		this.fire("exit");
	}
}

module.exports = LspServer;
