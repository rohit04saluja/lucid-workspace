import * as vscode from 'vscode';
import { initCommands } from './command';
import { Logger, getLogger } from './logger';
import { FsManager } from './manager/manager';

let fsManager:FsManager;

/** this method is called when your extension is activated */
export function activate(context: vscode.ExtensionContext) {
    /** Initialize logger */
    const log:Logger = getLogger()
    log.info("Workspaces is activated");

    /** Set to context that workspaces is activated */
    vscode.commands.executeCommand('setContext', 'workspaces:state',
        'activate');

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
    log.info(`Workspaces is enabling now with workspace folders ${wsFolders
        .map(e => e.uri).join(', ')
    }`);

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Setting up Workspaces to manage your workspace folders"
        }, () => {
            return new Promise<void>(resolve => {
                fsManager = new FsManager(wsFolders);
                resolve();
            });
        });

    /** Enabling was successful */
    vscode.commands.executeCommand('setContext', 'workspaces:state', 'enable');
}

/**
 * @brief
 * disable
 *
 * @description
 * disable the extension and tear down
 */
export function disable() {
    const log:Logger = getLogger();
    log.info(`Workspaces is disabling now`);
    vscode.commands.executeCommand('setContext', 'workspaces:state', 'disable');
}
