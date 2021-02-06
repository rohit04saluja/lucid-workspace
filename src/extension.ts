import * as vscode from 'vscode';
import { Logger, getLogger } from './logger';

/** this method is called when your extension is activated */
export function activate(context: vscode.ExtensionContext) {
    /** Initialize logger */
    const log:Logger = getLogger()
    log.info("Workspaces is activated");
}

/** this method is called when your extension is deactivated */
export function deactivate() {}
