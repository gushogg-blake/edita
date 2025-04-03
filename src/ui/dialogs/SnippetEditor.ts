import type {DialogEnv} from "ui/dialogs";
import type {Snippet} from "base/stores/snippets";

type SnippetEditorOptions = {
	id?: string;
	details?: Partial<Snippet>;
};

class App {
	static requiresTreeSitter = true;
	
	private env: DialogEnv;
	private options: SnippetEditorOptions;
	private snippet?: Snippet;
	private isNew: boolean;
	
	constructor(env: DialogEnv, options: SnippetEditorOptions) {
		//super();
		
		this.env = env;
		this.options = options;
	}
	
	async init(): Promise<void> {
		let {id, details} = this.options;
		
		this.isNew = !id;
		
		if (this.isNew) {
			this.snippet = {
				name: "",
				langGroups: [],
				langs: [],
				text: "",
				keyCombo: null,
				//isDynamic: false,
				...details,
			};
			
			this.env.setTitle("New snippet");
		} else {
			this.snippet = await base.stores.snippets.findById(id);
			
			this.env.setTitle(this.snippet.name);
		}
	}
	
	saveAndClose(snippet: Snippet): void {
		if (this.isNew) {
			base.stores.snippets.create(snippet);
		} else {
			base.stores.snippets.update(this.options.id, snippet);
		}
		
		this.close();
	}
	
	close(): void {
		this.env.close();
	}
	
	teardown(): void {
		
	}
}

export default App;
