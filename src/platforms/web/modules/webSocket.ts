let lid = require("utils/lid");
let throttle = require("utils/throttle");
let promiseWithMethods = require("utils/promiseWithMethods");

export default function(url, handlers) {
	let socket;
	
	let reconnect = throttle(createSocket, 3000);
	
	function onDisconnect() {
		if (handlers.disconnected) {
			handlers.disconnected();
		}
		
		reconnect();
	}
	
	function onMessage(_message) {
		let {id, message} = JSON.parse(_message.data);
		
		if (id) {
			requestPromises[id].resolve(message);
		} else {
			handlers.notification(message);
		}
	}
	
	function onConnect() {
		if (handlers.connected) {
			handlers.connected();
		}
	}
	
	function closeSocket() {
		socket.removeEventListener("open", onConnect);
		socket.removeEventListener("message", onMessage);
		socket.removeEventListener("error", onDisconnect);
		socket.removeEventListener("close", onDisconnect);
		socket.close();
	}
	
	function createSocket() {
		if (socket) {
			closeSocket();
		}
		
		socket = new WebSocket(url);
		
		socket.addEventListener("open", onConnect);
		socket.addEventListener("message", onMessage);
		socket.addEventListener("error", onDisconnect);
		socket.addEventListener("close", onDisconnect);
	}
	
	function heartbeat() {
		try {
			socket.send("test");
		} catch (e) {
			reconnect();
		}
	}
	
	createSocket();
	
	let heartbeatInterval = setInterval(heartbeat, 3000);
	
	let requestPromises = {};
	
	return {
		send(message) {
			socket.send(JSON.stringify({
				type: "message",
				message,
			}));
		},
		
		invoke(message) {
			let id = lid() + "-" + Math.random();
			let promise = promiseWithMethods();
			
			requestPromises[id] = promise;
			
			socket.send(JSON.stringify({
				type: "request",
				id,
				message,
			}));
			
			return promise;
		},
		
		close() {
			clearInterval(heartbeatInterval);
			closeSocket();
		},
	};
}
