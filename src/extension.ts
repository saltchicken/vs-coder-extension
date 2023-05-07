import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Response {
    filename: string;
    goal: string;
    code: string;
}

async function runPythonCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
		const pythonCode = `
import langchain
import os, json
import coder_AI
from dotenv import load_dotenv
load_dotenv()
TOKEN = os.getenv('OPENAI_KEY')
result = coder_AI.generate_code('Python', '${code}', TOKEN)
print(json.dumps(result))
`.trim().replace(/\n/g, ';');

        exec(`python -c "${pythonCode}"`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else if (stderr) {
                reject(new Error(stderr));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

async function replaceWithPythonOutput() {
    const input = await vscode.window.showInputBox({ prompt: 'Enter Python code to replace the file content:' });
    if (input === undefined) {
        return;
    }

    let output: string;
	try {
		output = await runPythonCode(input);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		vscode.window.showErrorMessage(`Python error: ${errorMessage}`);
		return;
	}

	const response: Response = JSON.parse(output);
	
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found.');
		return;
	}

	//Create target file
	const filePath = path.join(workspaceFolder.uri.fsPath, response.filename);
	vscode.window.showInformationMessage(filePath);
	//TODO Check if file already exists and increment filename
	fs.writeFile(filePath, response.code.trim(), async (err) => {
		if (err) {
			vscode.window.showErrorMessage(`Error creating file: ${err.message}`);
		} else {
			vscode.window.showInformationMessage('File created successfully.');
			// Open the created file in the editor
			try {
				const fileUri = vscode.Uri.file(filePath);
				const textDocument = await vscode.workspace.openTextDocument(fileUri);
				vscode.window.showTextDocument(textDocument);

			}  catch (error) {
				if (error instanceof Error) {
					vscode.window.showErrorMessage(`Error opening file: ${error.message}`);
				} else {
					vscode.window.showErrorMessage('Error opening file: Unknown error');
				}
			}
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('coder.replaceWithPythonOutput', replaceWithPythonOutput);
    context.subscriptions.push(disposable);
}

export function deactivate() {}