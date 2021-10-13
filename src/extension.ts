import Decimal from "decimal.js";
import {
  CancellationToken,
  commands,
  env,
  ExtensionContext,
  TextDocumentContentProvider,
  Uri,
  window,
  workspace,
} from "vscode";
import calculator = require('./calculator');
import { exec } from 'child_process';

const POSTING = /^\s+[\w:]+\s+([0-9.-]+)\s+\w+\s+\{([0-9.-]+)/

export function calculate(line: string): [Decimal, string] {
  const match = POSTING.exec(line)
  let result: Decimal;
  if (match) {
    const [_, amount, cost, ...rest] = match;
    result = new Decimal(amount).times(cost);
    line += ' ;';
  } else {
    result = calculator.parse(line.replace(/^\s*;/, ''));
  }
  return [result, `${line} = ${result.toString()}`];
}

function calcAndCopy() {
  const editor = window.activeTextEditor;
  if (editor == null) return;

  const currentLine = editor.document.lineAt(editor.selection.start.line);
  const [result, newLine] = calculate(currentLine.text);

  editor.edit(editBuilder => editBuilder.replace(currentLine.range, newLine));
  env.clipboard.writeText(result.toString());
}

const BEAN_DOCTOR_SCHEME = 'bean-doctor';

async function run(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, out) => {
      if (err) reject(err);
      else resolve(out);
    });
  });
}

class BeanDoctorOutput implements TextDocumentContentProvider {
  async provideTextDocumentContent(uri: Uri, _: CancellationToken): Promise<string> {
    const search = uri.query.split('&')
      .map(pair => pair.split('=').map(decodeURIComponent))
      .reduce((s, [k, v, ..._]) => s.set(k, v), new Map());
    const num = search.get('line');
    const file = search.get('file');
    if (num == null || file == null)
      return Promise.reject('line and file must not be null');
    try {
      return await run(`bean-doctor context ${file} ${num}`);
    } catch (e) {
      return Promise.reject(new Error(''));
    }
  }
}

export async function getBeanDoctorContext() {
  const editor = window.activeTextEditor;
  if (editor == null) return;

  const file = encodeURIComponent(editor.document.uri.path);
  const line = editor.selection.start.line + 1;
  const partsPath = editor.document.uri.path.split('/');
  const baseNameParts = partsPath[partsPath.length - 1].split('.');
  const displayName = baseNameParts.slice(0, baseNameParts.length - 1).join('.') +
    `.context.${line}.` + baseNameParts[baseNameParts.length - 1];
  const uri = Uri.parse(`${BEAN_DOCTOR_SCHEME}://context/${displayName}?file=${file}&line=${line}`);
  const doc = await workspace.openTextDocument(uri);
  await window.showTextDocument(doc, {preview: false});
}

export function activate(context: ExtensionContext) {
  context.subscriptions
    .push(commands.registerCommand('aaronsbeancountutils.calc', calcAndCopy));

  context.subscriptions
    .push(commands.registerCommand('aaronsbeancountutils.doctor', getBeanDoctorContext));

  context.subscriptions
    .push(workspace.registerTextDocumentContentProvider(BEAN_DOCTOR_SCHEME, new BeanDoctorOutput()));
}

// this method is called when your extension is deactivated
// export function deactivate() { }