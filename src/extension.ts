import * as vscode from 'vscode';
import Ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {

	console.log('Extension CASvoid activated.');

	const disposable = vscode.commands.registerCommand('casvoid.start', () => {
		vscode.window.showInformationMessage('Starting up.');
		const panel = vscode.window.createWebviewPanel(
			'casChat',
			'CASvoid Model',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebViewContent();

		panel.webview.onDidReceiveMessage( async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text ;
				let responseText = '' ;

				try {
					const streamResponse = await Ollama.chat({
						model: 'deepseek-coder',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					});
					for await (const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				}
				catch(err) { console.log(err) }
			}
		}) ;

	});

	const codegenvar = vscode.commands.registerCommand('casvoid.codegen', () => {
		vscode.window.showInformationMessage('Codegen from casvoid');
	});

	context.subscriptions.push(disposable, codegenvar);
}

function getWebViewContent(): string {
	return  /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<style>
			body { font-family: "Whitney Book"; margin: 1rem; }
			#prompt { width: 100%; box-sizing: border-box; }
			#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 1000px; }
		</style>
	</head>
	<body>
		<h2>CAS Extension</h2>
		<textarea id="prompt" rows="3" placeholder="?" > </textarea> <br />
		<button id="askBtn">Ask</button>

		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi() ; 

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				console.log("Sending message to extension:", text);
				vscode.postMessage({ command: 'chat', text }) ;
			});

			window.addEventListener('message', event => {
				const { command, text } = event.data ;
				if (command === 'chatResponse') {
					//console.log("chatresponse:", text);
					document.getElementById('response').innerText = text;
				}
			} )
		</script>
	</body>
	</html>
	`;
}

export function deactivate() {}
