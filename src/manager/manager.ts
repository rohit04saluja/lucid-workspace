import AsyncLock = require('async-lock');
import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 
import { FsProvider } from './fsTree';

/**
 * Class for Folder Manager
 */
export class FsManager {
    private logger: Logger = getLogger();
    private fsp:FsProvider = new FsProvider(this);
    public wsFolders:vscode.WorkspaceFolder[] = [];
    private lock = new AsyncLock();
    public filter:vscode.Uri[] = [];

    constructor(public context:vscode.ExtensionContext,) {
        this.logger.info('Initializing folder manager');
        let _d:vscode.Disposable;
        _d = vscode.window.registerTreeDataProvider('fs', this.fsp);
        this.context.subscriptions.push(_d);

        /** Register the commands */
        /** Register add to active command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.add-to-active',
            (file:vscode.Uri | undefined) => {
                this.logger.info(`Add to active called with ${file}`);
                if (file) {
                    this.addFilter([file]);
                }
            }
        );
        this.context.subscriptions.push(_d);

        /** Register add to active command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.remove-from-active',
            (file:vscode.Uri | undefined) => {
                this.logger.info(`Remove from active called with ${file}`);
                if (file) {
                    this.removeFilter([file]);
                }
            }
        );
        this.context.subscriptions.push(_d);

        /** Register add ws folders command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.add-ws-folders',
            (folders:vscode.WorkspaceFolder[] | undefined) => {
                this.logger.info(`Add ws folders called with ${folders}`);
                if (folders == undefined || folders.length == 0) {
                    wsFoldersQuickPick(undefined, this.wsFolders).then(
                        (value) => this.addWsFolders(value),
                        () => this.logger.warn('No folders selected')
                    );
                } else {
                    this.addWsFolders(folders);
                }
            }
        );
        this.context.subscriptions.push(_d);

        /** Register remove ws folders command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.remove-ws-folders',
            (folders:vscode.WorkspaceFolder[] | undefined) => {
                this.logger.info(`Remove ws folderd called with ${folders}`);
                if (folders == undefined || folders.length == 0) {
                    wsFoldersQuickPick(this.wsFolders).then(
                        (value) => this.removeWsFolders(value),
                        () => this.logger.warn('No folders selected')
                    );
                } else {
                    this.removeWsFolders(folders);
                }
            }
        );
        this.context.subscriptions.push(_d);
    }

    deactivate() {
        this.logger.info('FsManager is being deactived')
    }

    public addWsFolders(folders:vscode.WorkspaceFolder[]) {
        this.logger.info(`Add ${folders.map(e => e.uri.fsPath)} to FS manager`);
        this.lock.acquire(
            'wsFolders',
            () => this.wsFolders = this.wsFolders.concat(folders)
        ).then(() => {
            this.fsp.refresh();
            this.updateContext();
        });
    }

    public removeWsFolders(folders:vscode.WorkspaceFolder[]) {
        this.logger.info(`Remove ${
            folders.map(e => e.uri.fsPath)
        } from FS manager`);
        this.lock.acquire('wsFolders', () => 
            this.wsFolders = this.wsFolders.filter(e => !folders.includes(e))
        ).then(() => {
            this.fsp.refresh();
            this.updateContext();
        });
    }

    private async updateContext() {
        vscode.commands.executeCommand('setContext',
            'lucid-workspace:fs.root.length', this.wsFolders.length);
    }

    public addFilter(files:vscode.Uri[]) {
        this.logger.info(`Add filter for ${files.map(e => e.fsPath)}`);
        this.lock.acquire('filter',
            () => this.filter = this.filter.concat(files)
        ).then(() => this.fsp.refresh());
    }

    public removeFilter(files:vscode.Uri[]) {
        this.logger.info(`Remove filter for ${files.map(e => e.fsPath)}`);
        let _match:string[] = files.map(e => e.fsPath);
        this.lock.acquire('filter',
            () => this.filter.filter(e => !_match.includes(e.fsPath))
        ).then(() => this.fsp.refresh());
    }
}

/**
 * @brief
 * wsFoldersQuickPick
 *
 * @param excludes 
 *
 * @return
 * Promises selected workspace folders 
 */
export function wsFoldersQuickPick(
    folders?:vscode.WorkspaceFolder[],
    excludes?:vscode.WorkspaceFolder[])
    :Promise<vscode.WorkspaceFolder[]> {

    if (!folders) {
        folders = vscode.workspace.workspaceFolders?
            [...vscode.workspace.workspaceFolders]:[];
    }
    let _filtered:vscode.WorkspaceFolder[] | undefined =
        folders
        ?.filter(e => excludes?!excludes.includes(e):true);
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
                        if (value && folders) {
                            resolve(folders
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
