import parseJson from "utils/parseJson";

/*
you can't see the data (only the types) on dragover, and types can't contain
uppercase chars, so we encode all the data into a string of char codes.
*/

export default {
	get(e: DragEvent): any {
		for (let encodedStr of e.dataTransfer.types) {
			try {
				let str = encodedStr.split(",").map(Number).map(n => String.fromCharCode(n)).join("");
				let json = parseJson(str);
				
				if (json?.isAstDragDrop) {
					return json.data;
				}
			} catch (e) {}
		}
		
		return null;
	},
	
	set(e: DragEvent, data: any): void {
		let json = JSON.stringify({
			isAstDragDrop: true,
			data,
		});
		
		let str = json.split("").map(c => c.charCodeAt(0)).join(",");
		
		e.dataTransfer.setData(str, "");
	},
};
