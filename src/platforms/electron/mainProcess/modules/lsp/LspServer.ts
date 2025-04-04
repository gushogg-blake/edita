import {Evented, lid, sleep, promiseWithMethods} from "utils/node";
import type {PromiseWithMethods} from "utils";
import {spawn} from "utils/node";
import type App from "electronMain/App";
import config from "./config";

export default class LspServer extends Evented<{
	start: void;
	notification: any; // TYPE probs just leave this as any...
	error: string;
}> {
	ready: boolean = false;
	serverCapabilities: any; // TYPE (see also modules/.../LspServer)
	
	private app: App;
	private langCode: string;
	private initializeParams: any;
	private requestPromises: Record<string, PromiseWithMethods<any>> = {};
	private responseBuffer: Buffer;
	private process: any; // TYPE Node process (from spawn)
	private closed: boolean = false;
	
	constructor(app: App, langCode: string, initializeParams) {
		super();
		
		this.app = app;
		this.langCode = langCode;
		this.initializeParams = initializeParams;
		
		this.responseBuffer = Buffer.alloc(0);
	}
	
	async start() {
		let {command, setInitializeParams} = config.perLang[this.langCode](this.app);
		let [cmd, ...args] = command;
		
		this.process = await spawn(cmd, args);
		
		this.process.stdout.on("data", this.onData.bind(this));
		this.process.stderr.on("data", this.onError.bind(this));
		
		this.process.on("exit", this.onExit.bind(this));
		
		let initializeParams = {
			processId: process.pid,
			...this.initializeParams,
		};
		
		setInitializeParams(initializeParams);
		
		let {capabilities} = await this.request("initialize", initializeParams);
		
		this.serverCapabilities = capabilities;
		this.ready = true;
		
		this.fire("start");
	}
	
	request(method: string, params): Promise<any> { // TYPE seems like it might be loads of typing to get proper types for these
		let id = lid();
		
		let json = JSON.stringify({
			id,
			jsonrpc: "2.0",
			method,
			params,
		});
		
		let message = "Content-Length: " + json.length + "\r\n\r\n" + json;
		
		//console.log(this.process.pid, message);
		
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
		}, config.requestTimeout);
		
		return promise;
	}
	
	notify(method, params) {
		let json = JSON.stringify({
			jsonrpc: "2.0",
			method,
			params,
		});
		
		let message = "Content-Length: " + json.length + "\r\n\r\n" + json;
		
		//console.log(this.process.pid, message.substr(0, 150));
		
		this.process.stdin.write(message);
	}
	
	close() {
		this.closed = true;
		this.ready = false;
		
		this.process.kill();
	}
	
	onData(data) {
		let {responseBuffer} = this;
		
		this.responseBuffer = Buffer.alloc(responseBuffer.length + data.length);
		this.responseBuffer.set(responseBuffer);
		this.responseBuffer.set(data, responseBuffer.length);
		
		//console.log(this.process.pid, data.toString());
		
		this.checkResponseBuffer();
	}
	
	checkResponseBuffer() {
		let split = -1;
		
		for (let i = 0; i < this.responseBuffer.length; i++) {
			if (this.responseBuffer.subarray(i, i + 4).toString() === "\r\n\r\n") {
				split = i + 4;
				
				break;
			}
		}
		
		if (split === -1) {
			return;
		}
		
		let headers = this.responseBuffer.subarray(0, split).toString();
		let length = Number(headers.match(/Content-Length: (\d+)/)[1]);
		let rest = this.responseBuffer.subarray(split, split + length);
		
		if (rest.length < length) {
			return;
		}
		
		this.responseBuffer = Buffer.from(this.responseBuffer.subarray(split + length));
		
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
		
		if (this.responseBuffer.length > 0) {
			this.checkResponseBuffer();
		}
	}
	
	onError(data) {
		console.error(data.toString());
		
		this.fire("error", data.toString());
	}
	
	async onExit() {
		if (this.closed) {
			return;
		}
		
		this.ready = false;
		
		await sleep(2000);
		
		this.start();
	}
}
