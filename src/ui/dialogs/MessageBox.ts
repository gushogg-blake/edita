import type {DialogEnv} from "ui/dialogs";

type MessageBoxOptions = {
	title?: string;
	message: string;
	buttons: string[];
};

export default class App {
	private env: DialogEnv;
	private options: MessageBoxOptions;
	private hasResponded: boolean = false;
	private teardownCallbacks: Array<() => void>;
	
	constructor(env: DialogEnv, options: MessageBoxOptions) {
		this.env = env;
		this.options = options;
		
		this.teardownCallbacks = [
			platform.on("dialogClosed", this.onDialogClosed.bind(this)),
		];
	}
	
	async init() {
		this.env.setTitle(this.options.title || "");
	}
	
	_respond(buttonIndex) {
		if (this.hasResponded) {
			return;
		}
		
		platform.callOpener("dialogResponse", {
			name: "messageBox",
			response: buttonIndex,
		});
		
		this.hasResponded = true;
	}
	
	respond(response) {
		this._respond(response);
		
		this.env.close();
	}
	
	onDialogClosed() {
		this._respond(null);
	}
	
	teardown() {
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}
