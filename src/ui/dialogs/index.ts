import FileChooser from "./FileChooser";
import MessageBox from "./MessageBox";
import SnippetEditor from "./SnippetEditor";

export interface DialogEnv {
	close(): void;
	respond(response: any): void;
}

export interface DialogApp {
	init(): Promise<void>;
	// for the env to tell the dialog app that it's been
	// closed so it can e.g. send a null/canceled response
	notifyClosed(): void;
}

export default {
	fileChooser: FileChooser,
	messageBox: MessageBox,
	snippetEditor: SnippetEditor,
};
