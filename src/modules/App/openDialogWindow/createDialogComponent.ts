import {mount, unmount} from "svelte";

/*
NOTE a lot of the logic here is duplicated in electron/pages/[dialog]/App.ts

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
		
		let snippetEditor = mount(base.components.SnippetEditor, {
			props: {
				snippet,
				
				onsaveAndExit: async ({snippet}) => {
					if (isNew) {
						await platform.snippets.create(snippet);
					} else {
						await platform.snippets.update(id, snippet);
					}
					
					close();
				},
				
				oncancel: close,
			},
		});
		
		return () => {
			unmount(snippetEditor);
		};
	},
	
	messageBox(el, dialogOptions, close) {
		let messageBox = mount(base.components.MessageBox, {
			target: el,
			
			props: {
				options: dialogOptions,
				
				onresponse: (response) => {
					this.messageBoxRespond(response);
					
					close();
				},
			},
		});
		
		return () => {
			this.messageBoxRespond(null);
			
			unmount(messageBox);
		};
	},
};
