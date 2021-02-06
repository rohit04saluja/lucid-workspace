import * as vscode from "vscode";
import { disable, enable } from "./extension";
import { getLogger, Logger } from "./logger";

/**
 * @brief
 * init
 */
export function initCommands () {
    const log:Logger = getLogger();

    /** Register enable command */
    vscode.commands.registerCommand('workspaces.enable',
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
                        vscode.workspace.workspaceFolders.map<vscode.QuickPickItem>(e => ({
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
                                    )
                                );
                            }
                        } else {
                            log.error('No workspace folder was selected');
                        }
                    });
                } else {
                    enable([vscode.workspace.workspaceFolders[0]]);
                }
            }
        } else {
            enable(folders);
        }
    });

    /** Register disable command */
    vscode.commands.registerCommand('workspaces.disable', () => {
        disable();
    })
}
