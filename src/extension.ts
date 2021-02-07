import * as vscode from 'vscode';
import { Logger, getLogger } from './logger';
import { FsManager } from './manager/manager';

/** this method is called when your extension is activated */
export function activate(context: vscode.ExtensionContext) {
    /** Initialize logger */
    const log:Logger = getLogger();
    let _d:vscode.Disposable;
    log.info("Workspaces is activated");

    /** Set to context that workspaces is activated */
    vscode.commands.executeCommand('setContext', 'workspaces:state',
        'activate');

    /** Register enable command */
    _d = vscode.commands.registerCommand('workspaces.enable',
        (folders:vscode.WorkspaceFolder[]) => {
        if (!folders || folders.length == 0) {
            log.info('Enable command called without any folders');
            if (!vscode.workspace.workspaceFolders
                || vscode.workspace.workspaceFolders.length == 0) {

                log.info('There are no folders in this workspace')
                const opts = ['Add Folder', 'Ok'];
                vscode.window.showErrorMessage(`Workspaces can not be enabled.
                    There are no folders added to Workspace. Please add
                    folder(s) to workspace and try again.`,
                    ...opts).then((value:string | undefined) => {

                    switch(value) {
                        /** Execute command to add workspaceFolders */
                        case opts[0]:
                            vscode.commands.executeCommand(
                                'workbench.action.addRootFolder'
                            );
                            break;
                        default:
                            break;
                    }
                });
            } else {
                if (vscode.workspace.workspaceFolders.length > 1) {
                    vscode.window.showQuickPick(
                        vscode.workspace.workspaceFolders
                            .map<vscode.QuickPickItem>(e => ({
                            "label": e.name,
                            "description": e.uri.fsPath
                        })),
                        {
                            "canPickMany": true,
                            "placeHolder": "Select workspace folders",
                        }
                    ).then((value) => {
                        if (value) {
                            log.info(`Workspace folder picked is ${value.map(
                                e => `${e.description}/${e.label}`)
                            }`);
                            if (vscode.workspace.workspaceFolders) {
                                enable(vscode.workspace.workspaceFolders
                                    .filter(e => 
                                        value.map(e => e.description)
                                            .includes(e.uri.fsPath)
                                    ), context
                                );
                            }
                        } else {
                            log.error('No workspace folder was selected');
                        }
                    });
                } else {
                    enable([vscode.workspace.workspaceFolders[0]], context);
                }
            }
        } else {
            enable(folders, context);
        }
    });
    context.subscriptions.push(_d);

    /** Register disable command */
    _d = vscode.commands.registerCommand('workspaces.disable', () => {
        disable();
    });
    context.subscriptions.push(_d);
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
export function enable(wsFolders:vscode.WorkspaceFolder[],
                       context:vscode.ExtensionContext) {
    const log:Logger = getLogger();
    log.info(`Workspaces is enabling now with workspace folders ${wsFolders
        .map(e => e.uri).join(', ')
    }`);

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Setting up Workspaces to manage your workspace folders"
        }, () => {
            return new Promise<void>(resolve => {
                let fsManager:FsManager = new FsManager(wsFolders, context);
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
