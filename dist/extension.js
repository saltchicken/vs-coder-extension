/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("path");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const child_process_1 = __webpack_require__(2);
const fs = __webpack_require__(3);
const path = __webpack_require__(4);
async function runPythonCode(code) {
    return new Promise((resolve, reject) => {
        const pythonCode = `
import langchain
import os, json
import coder_AI
from dotenv import load_dotenv
load_dotenv()
TOKEN = os.getenv('OPENAI_API_KEY')
result = coder_AI.generate_code('Python', '${code}', TOKEN)
print(json.dumps(result))
`.trim().replace(/\n/g, ';');
        (0, child_process_1.exec)(`python -c "${pythonCode}"`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else if (stderr) {
                reject(new Error(stderr));
            }
            else {
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
    let output;
    try {
        output = await runPythonCode(input);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Python error: ${errorMessage}`);
        return;
    }
    const response = JSON.parse(output);
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
        }
        else {
            vscode.window.showInformationMessage('File created successfully.');
            // Open the created file in the editor
            try {
                const fileUri = vscode.Uri.file(filePath);
                const textDocument = await vscode.workspace.openTextDocument(fileUri);
                vscode.window.showTextDocument(textDocument);
            }
            catch (error) {
                if (error instanceof Error) {
                    vscode.window.showErrorMessage(`Error opening file: ${error.message}`);
                }
                else {
                    vscode.window.showErrorMessage('Error opening file: Unknown error');
                }
            }
        }
    });
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('coder.replaceWithPythonOutput', replaceWithPythonOutput);
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map