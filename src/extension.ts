import Decimal from "decimal.js";
import {
  CancellationToken,
  commands,
  DocumentSymbol,
  DocumentSymbolProvider,
  env,
  ExtensionContext,
  languages,
  Location,
  ProviderResult,
  SymbolInformation,
  TextDocument,
  TextDocumentContentProvider,
  Uri,
  window,
  workspace,
} from "vscode";
import calculator = require('./calculator');
import { exec } from 'child_process';
import { SymbolKind } from "vscode";
import { Position } from "vscode";
import { Range } from "vscode";

const POSTING = /^\s+[\w:]+\s+([0-9.-]+)\s+\w+\s+\{([0-9.-]+)/;

export function calculate(line: string): [Decimal, string] {
  // First strip off the existing calculation in case we're re-calculating.
  line = line.replace(/\s*;?\s*=\s*[-\d.]+$/, '');

  const match = POSTING.exec(line);
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
    return await run(`bean-doctor context ${file} ${num}`);
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

function levelFromLine(text: string): number {
  let level = -1;
  while (text[++level] === '*');
  return level;
}

function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

class HierarchicalDocumentSymbol extends DocumentSymbol {
  level: number;

  constructor(name: string, range: Range, selectionRange: Range, level: number) {
    super(name, '', SymbolKind.Namespace, range, selectionRange);
    this.level = level;
  }
}

class SymbolProvider implements DocumentSymbolProvider {
  async provideDocumentSymbols(document: TextDocument, _: CancellationToken): Promise<DocumentSymbol[]> {
    const lastLine = document.lineAt(document.lineCount - 1);
    const start = new Position(0, 0);
    const end = new Position(lastLine.lineNumber, lastLine.text.length);
    const root = new HierarchicalDocumentSymbol('root', new Range(start, end), new Range(start, start), 0);
    let stack: HierarchicalDocumentSymbol[] = [root];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const level = levelFromLine(line.text);

      if (level > 0) {
        const name = line.text.replace(/^\*+ /, '').trim();

        // Pop everything off the stack that's lower in the hierarchy.
        stack = stack.filter(i => {
          const shouldKeep = i.level < level;

          // If it's getting popped, reset its end to the current position.
          if (!shouldKeep) {
            const previousNumber = line.range.start.line - 1;
            i.range = new Range(
              i.range.start,
              new Position(
                previousNumber,
                document.lineAt(previousNumber).text.length));
          }
          return shouldKeep;
        });

        const newSymbol = new HierarchicalDocumentSymbol(
          name,
          new Range(line.range.start, end),
          new Range(
            new Position(line.range.start.line, line.text.length - name.length),
            new Position(line.range.start.line, line.text.length)),
          level);
        last(stack)?.children.push(newSymbol);
        stack.push(newSymbol);
      }
    }

    return root.children;
  }
}

export function activate(context: ExtensionContext) {
  context.subscriptions
    .push(commands.registerCommand('aaronsbeancountutils.calc', calcAndCopy));

  context.subscriptions
    .push(commands.registerCommand('aaronsbeancountutils.doctor', getBeanDoctorContext));

  context.subscriptions
    .push(workspace.registerTextDocumentContentProvider(BEAN_DOCTOR_SCHEME, new BeanDoctorOutput()));

  context.subscriptions
    .push(languages.registerDocumentSymbolProvider('beancount', new SymbolProvider(), {label: 'Sections'}));
}

// this method is called when your extension is deactivated
// export function deactivate() { }
