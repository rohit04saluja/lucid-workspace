import * as vscode from 'vscode';
import { initCommands } from './command';
import { Logger, getLogger } from './logger';

/** this method is called when your extension is activated */
export function activate(context: vscode.ExtensionContext) {
    /** Initialize logger */
    const log:Logger = getLogger()
    log.info("Workspaces is activated");

    /** Set to context that workspaces is activated */
    vscode.commands.executeCommand('setContext', 'workspaces:state', 'activate');

    /** Initialize the commands */
    initCommands();
}

/** this method is called when your extension is deactivated */
export function deactivate() {}

/**
 * @brief
 * enable
 *
 * @description
 * enable the extension and Initialize the tree view
 */
export function enable(wsFolders:vscode.WorkspaceFolder[]) {
    const log:Logger = getLogger();
    log.info(`Workspaces is enabling now with workspace folders 
        ${wsFolders.map(e => e.uri).join(', ')}`);
    vscode.commands.executeCommand('setContext', 'workspaces:state', 'enable');
}
