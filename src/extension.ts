// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, env, ExtensionContext, window } from "vscode";
import calculator = require('./calculator');

function calcAndCopy() {
		const editor = window.activeTextEditor;
		if (editor == null) return;

		const currentLine = editor.document.lineAt(editor.selection.start.line);
		const result = calculator.parse(currentLine.text.replace(/^;/, ''))
			.toString();

		editor.edit(editBuilder => {
			editBuilder.replace(currentLine.range, `${currentLine.text} = ${result}`);
		});

		env.clipboard.writeText(result);
}

export function activate(context: ExtensionContext) {
	context.subscriptions
	  .push(commands.registerCommand('aaronsbeancountutils.calc', calcAndCopy));
}

// this method is called when your extension is deactivated
// export function deactivate() { }
