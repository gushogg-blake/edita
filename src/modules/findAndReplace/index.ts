export type CaseMode = "match" | "ignore";

export type FindAndReplaceOptions = {
	find: string;
	replace: boolean;
	replaceWith: string;
	regex: boolean;
	multiline: boolean;
	caseMode: CaseMode;
	word: boolean;
};

export const defaultOptions = {
	find: "",
	replace: false,
	replaceWith: "",
	regex: false,
	multiline: false,
	caseMode: "match",
	word: false,
};
