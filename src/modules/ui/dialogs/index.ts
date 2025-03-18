import FileChooser from "./FileChooser";
import MessageBox from "./MessageBox";
import SnippetEditor from "./SnippetEditor";

interface DialogEnv {
	close(): void;
	respond(response: any): void;
}

interface DialogApp {
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
