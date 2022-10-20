let Evented = require("../utils/Evented");
let lid = require("../utils/lid");
let spawn = require("../utils/spawn");
let promiseWithMethods = require("../utils/promiseWithMethods");
let fs = require("./fs");

let cmds = {
	javascript(app) {
		let nodeModules = app.rootDir.child("node_modules");
		
		return [
			"node",
			"--inspect=127.0.0.1:6000",
			nodeModules.child("typescript-language-server", "lib", "cli.js").path,
			"--stdio",
			"--log-level=4",
			"--tsserver-path=" + nodeModules.child("typescript/lib/tsserver.js").path,
			//"--tsserver-log-file=/home/gus/logs.txt",
		];
	},
};

let REQUEST_TIMEOUT = 5000;

class LspServer extends Evented {
	constructor(app, id, langCode) {
		super();
		
		this.app = app;
		this.id = id;
		this.langCode = langCode;
		this.requestPromises = {};
		
		this.buffer = Buffer.alloc(0);
	}
	
	async init(capabilities, initOptions, workspaceFolders) {
		let [cmd, ...args] = cmds[this.langCode](this.app);
		
		this.process = await spawn(cmd, args);
		
		this.process.stdout.on("data", this.onData.bind(this));
		this.process.stderr.on("data", this.onError.bind(this));
		
		this.process.on("exit", this.onExit.bind(this));
		
		let {
			capabilities: serverCapabilities,
		} = await this.request("initialize", {
			processId: process.pid,
			capabilities,
			initializationOptions: initOptions,
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
		
		let message = "Content-Length: " + json.length + "\r\n\r\n" + json;
		
		//console.log(message);
		
		this.process.stdin.write(message);
		
		let promise = promiseWithMethods();
		
		this.requestPromises[id] = promise;
		
		setTimeout(() => {
			delete this.requestPromises[id];
			
			promise.reject({
				error: "Request timed out",
				method,
				params,
			});
		}, REQUEST_TIMEOUT);
		
		return promise;
	}
	
	notify(method, params) {
		let json = JSON.stringify({
			jsonrpc: "2.0",
			method,
			params,
		});
		
		let message = "Content-Length: " + json.length + "\r\n\r\n" + json;
		
		//console.log(message);
		
		this.process.stdin.write(message);
	}
	
	close() {
		this.process.kill();
	}
	
	onData(data) {
		try {
			let {buffer} = this;
			
			this.buffer = Buffer.alloc(buffer.length + data.length);
			this.buffer.set(buffer);
			this.buffer.set(data, buffer.length);
			
			let split = -1;
			
			for (let i = 0; i < this.buffer.length; i++) {
				if (this.buffer.subarray(i, i + 4).toString() === "\r\n\r\n") {
					split = i + 4;
					
					break;
				}
			}
			
			if (split === -1) {
				return;
			}
			
			let headers = this.buffer.subarray(0, split).toString();
			let length = Number(headers.match(/Content-Length: (\d+)/)[1]);
			let rest = this.buffer.subarray(split, split + length);
			
			if (rest.length < length) {
				return;
			}
			
			this.buffer = Buffer.from(this.buffer.subarray(split + length));
			
			let message = JSON.parse(rest.toString());
			
			if (message.id) {
				let {id, error, result} = message;
				
				if (error) {
					this.requestPromises[id].reject(error);
				} else {
					this.requestPromises[id].resolve(result);
				}
				
				delete this.requestPromises[id];
			} else {
				let {method, params} = message;
				
				this.fire("notification", {method, params});
			}
		} catch (e) {
			console.error(e);
		}
	}
	
	onError(data) {
		console.error(data.toString());
	}
	
	onExit(code) {
		this.fire("exit", code);
	}
}

module.exports = LspServer;
