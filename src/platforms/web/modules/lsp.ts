import LspServer from "modules/lsp/LspServer";
import webSocket from "platforms/web/modules/webSocket";

export default function(url) {
	let socket = webSocket(url, {
		notification(message) {
			let {serverId, notification} = message;
			let {method, params} = notification;
			
			servers[serverId].notificationReceived(method, params);
		},
	});
	
	return {
		async createServer(langCode, options) {
			
		},
		
		//request(serverId, method, params) {
		//	return socket.invoke({
		//		serverId,
		//		method,
		//		params,
		//	});
		//},
		//
		//notify(serverId, method, params) {
		//	socket.send({
		//		serverId,
		//		method,
		//		params,
		//	});
		//},
	};
}
