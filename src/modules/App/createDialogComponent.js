/*
NOTE a lot of the logic here is duplicated in electron/dialogs/[dialog]/App.js

could be made generic and moved to Base maybe
*/

module.exports = {
	async snippetEditor(el, dialogOptions, onClose) {
		let {id} = dialogOptions;
		let isNew = !id;
		let snippet;
		
		if (isNew) {
			snippet = {
				name: "",
				langGroups: [],
				langs: [],
				text: "",
				isDynamic: false,
			};
		} else {
			snippet = await platform.snippets.findById(id);
		}
		
		let snippetEditor = new base.components.SnippetEditor({
			target: el,
			
			props: {
				snippet,
			},
		});
		
		snippetEditor.$on("saveAndExit", async ({detail: snippet}) => {
			if (isNew) {
				await platform.snippets.create(snippet);
			} else {
				await platform.snippets.update(id, snippet);
			}
			
			onClose();
		});
		
		snippetEditor.$on("cancel", onClose);
	},
	
	findAndReplace(el, dialogOptions, onClose) {
		let options = {
			replace: false,
			searchIn: "currentDocument",
			search: "",
			replaceWith: "",
			regex: false,
			caseMode: "caseSensitive",
			word: false,
			multiline: false,
			paths: [],
			searchInSubDirs: true,
			includePatterns: [],
			excludePatterns: [],
			showResults: false,
			...dialogOptions,
		};
		
		let findAndReplace = new base.components.FindAndReplace({
			target: el,
			
			props: {
				options,
				findAndReplace: this.findAndReplace,
			},
		});
		
		findAndReplace.$on("done", onClose);
	},
	
	messageBox(el, dialogOptions, onClose) {
		let messageBox = new base.components.MessageBox({
			target: el,
			
			props: {
				options: dialogOptions,
			},
		});
		
		messageBox.$on("response", ({detail: response}) => {
			this.messageBoxRespond(response);
			
			onClose();
		});
	},
};
