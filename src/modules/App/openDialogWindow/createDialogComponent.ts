/*
NOTE a lot of the logic here is duplicated in electron/dialogs/[dialog]/App.js

could be made generic and moved to Base maybe
*/

export default {
	async snippetEditor(el, dialogOptions, close) {
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
			
			close();
		});
		
		snippetEditor.$on("cancel", close);
	},
	
	messageBox(el, dialogOptions, close) {
		let responded = false;
		
		let messageBox = new base.components.MessageBox({
			target: el,
			
			props: {
				options: dialogOptions,
			},
		});
		
		messageBox.$on("response", ({detail: response}) => {
			this.messageBoxRespond(response);
			
			close();
		});
		
		return () => {
			this.messageBoxRespond(null);
		}
	},
};
