import { useEffect, useRef, useState } from "react";

export type SocketStatus = "running" | "completed" | "failed";

export const useSocket = ({ url }: { url: string }) => {
	const [connected, setConnected] = useState(false);
	const [log, setLog] = useState<string[]>([]);
	const [status, setStatus] = useState<SocketStatus>("running");
	const [output, setOutput] = useState<string[]>([]);
	const [message, setMessage] = useState(null);

	const ws = useRef<WebSocket | null>(null);

	useEffect(() => {
		if (!url) return;

		const addLog = (text: string, prefix = "> ") => {
			setLog((prev) => [...prev, `${prefix} ${text}`]);
		};

		const socket = new WebSocket(url);

		socket.onopen = () => {
			setConnected(true);
			addLog("Websocket Connected");
		};

		socket.onclose = () => {
			setConnected(false);
			addLog("Websocket Disconnected");
		};

		socket.onmessage = (event) => {
			const text = JSON.stringify(event.data);
			const message = JSON.parse(event.data);
			setMessage(message);

			addLog(`Websocket message: ${text}`);

			switch (message.type) {
				// case "execute":
				// 	setOutput((prev) => [...prev, `${message.command} \n`]);
				// 	break;

				case "stdout":
				case "stderr": {
					const lines = message.data.split("\n")
						.filter((line: string) => line.trim())
						.map((line: string) => {
							return line.startsWith('$') ? `\n${line}\n` : line;
						});

					setOutput((prev) => [...prev, ...lines]);
					break;
				}

				case "status":
					setOutput((prev) => [
						...prev,
						`\nExecution finished with status: ${message.data}`,
					]);
					setStatus(message.data);
					break;

				case "error":
					setStatus("failed");
					addLog(`Error: ${message.data}`);
					break;
			}
		};

		ws.current = socket;

		return () => socket.close();
	}, [url]);

	//

	// bind is needed to make sure `send` references correct `this`
	// return [isOpen, log, message, ws.current?.send.bind(ws.current)];
	return { connected, log, status, message, output };
};
