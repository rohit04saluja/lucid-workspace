import * as vscode from "vscode";
import { enable } from "./extension";
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
                const opts = ['Add Folder', 'Try Again', 'Ok'];
                vscode.window.showErrorMessage(`Workspaces can not be enabled.
                    There are no folders added to Workspace. Please add folder(s) to workspace and try again.`,
                    ...opts).then((value:string | undefined) => {

                    switch(value) {
                        /** Execute command to add workspaceFolders */
                        case opts[0]:
                            vscode.commands.executeCommand(
                                'workbench.action.addRootFolder'
                            );
                            break;
                        case opts[1]:
                            vscode.commands.executeCommand(
                                'workspaces.enable'
                            );
                        default:
                            break;
                    }
                });
            }
        } else {
            enable(folders);
        }
    });
}