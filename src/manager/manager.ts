import AsyncLock = require('async-lock');
import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 
import { FsProvider } from './fsTree';

/**
 * Class for Folder Manager
 */
export class FsManager {
    private logger: Logger = getLogger();
    private fsp:FsProvider = new FsProvider();
    public wsFolders:vscode.WorkspaceFolder[] = [];
    private lock = new AsyncLock();

    constructor (private context:vscode.ExtensionContext,
                 wsFolders?:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing folder manager');
        if (wsFolders) {
            this.addWsFolders(wsFolders);
        }

        let _d:vscode.Disposable;
        /** Register add to active command */
        _d = vscode.commands.registerCommand(
            'workspaces.add-to-active',
            (files:vscode.Uri) => {
                this.logger.info(`Add to active is called with ${files}`);
            }
        );
        this.context.subscriptions.push(_d);
    }

    public addWsFolders(folders:vscode.WorkspaceFolder[]) {
        this.logger.info(`Add ${folders.map(e => e.uri.fsPath)} to FS manager`);
        this.lock.acquire(
            'wsFolders',
            () => this.wsFolders = this.wsFolders.concat(folders)
        );
        this.fsp.addFolders(folders);
    }

    public removeWsFolders(folders:vscode.WorkspaceFolder[]) {
        this.logger.info(`Remove ${
            folders.map(e => e.uri.fsPath)
        } from FS manager`);
        this.lock.acquire('wsFolders', () => 
            this.wsFolders = this.wsFolders.filter(e => !folders.includes(e))
        );
        this.fsp.removeFolders(folders);
    }
}

/**
 * @brief
 * wsFoldersQuickPick
 *
 * @param existingFolders 
 *
 * @return
 * Promises selected workspace folders 
 */
export function wsFoldersQuickPick(existingFolders?:vscode.WorkspaceFolder[])
    :Promise<vscode.WorkspaceFolder[]> {

    let _filtered:vscode.WorkspaceFolder[] | undefined =
        vscode.workspace.workspaceFolders
        ?.filter(e => existingFolders?existingFolders.includes(e):true);
    if (_filtered) {
        if (_filtered.length > 1) {
            return new Promise<vscode.WorkspaceFolder[]>((resolve, reject) => {
                if (_filtered) {
                    vscode.window.showQuickPick(_filtered
                        .map<vscode.QuickPickItem>(e => 
                            ({ "label": e.name, "description": e.uri.fsPath })
                    ), {
                        "canPickMany": true,
                        "placeHolder": "Select workspace folders"
                    }).then((value:vscode.QuickPickItem[] | undefined) => {
                        if (value && vscode.workspace.workspaceFolders) {
                            resolve(vscode.workspace.workspaceFolders
                                .filter(e => value.map(e => e.description)
                                    .includes(e.uri.fsPath)));
                        }
                        reject();
                    });
                }
            });
        } else {
            return Promise.resolve(_filtered);
        }
    }
    return Promise.reject();
}
