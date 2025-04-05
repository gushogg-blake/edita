import {CodeIntel} from "modules/codeIntel";

export default class extends CodeIntel {
	indentOnNewline(document, line, cursor) {
		
	}
	
	indentAdjustmentAfterInsertion(document, line, cursor) {
		return 0;
	}
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("composer.json");
	}
};
