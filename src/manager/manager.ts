import AsyncLock = require('async-lock');
import { basename, dirname, join } from 'path';
import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 
import { FsProvider, FsTreeItem } from './fsTree';
import { resetFilesExcludes, updateFileExcludes } from '../config';

/**
 * Class for Folder Manager
 */
export class FsManager {
    private logger: Logger = getLogger();
    private fsp:FsProvider = new FsProvider(this);
    public wsFolders:vscode.Uri[] = [];
    private lock = new AsyncLock();
    public filter:string[] = [];

    constructor(public context:vscode.ExtensionContext,) {
        this.logger.info('Initializing folder manager');
        this.loadState();
        if (this.wsFolders.length > 0) {
            this.updateContext();
            this.updateFilter();
        }

        let _d:vscode.Disposable;
        _d = vscode.window.registerTreeDataProvider('fs', this.fsp);
        this.context.subscriptions.push(_d);

        /** Register the commands */
        /** Register add to active command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.add-to-active',
            (file:FsTreeItem | undefined) => {
                this.logger.info(`Add to active called with ${file}`);
                if (file) {
                    this.addFilter([file.resourceUri]);
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
            (folders:vscode.Uri[] | undefined) => {
                this.logger.info(`Add ws folders called with ${folders}`);
                if (folders == undefined || folders.length == 0) {
                    wsFoldersQuickPick(
                        undefined,
                        this.wsFolders.map(e => e.fsPath)
                    ).then(
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
            (folders:vscode.Uri[] | undefined) => {
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
        this.logger.info('FsManager is being deactived');
        this.removeWsFolders(this.wsFolders);
    }

    public addWsFolders(folders:vscode.Uri[]) {
        const _folders = folders.map(e => e.fsPath);
        this.logger.info(`Add ${_folders.join(', ')} to FS manager`);
        this.lock.acquire(
            'wsFolders',
            () => this.wsFolders = this.wsFolders.concat(folders)
        ).then(() => {
            this.saveFolders();
            this.fsp.refresh();
            this.updateContext();
            this.updateFilter();
        });
    }

    public removeWsFolders(folders:vscode.Uri[]) {
        const _folders:string[] = folders.map(e => e.fsPath);
        this.logger.info(`Remove ${_folders} from FS manager`);
        this.lock.acquire('wsFolders', () =>
            this.wsFolders = this.wsFolders.filter(
                e => !_folders.includes(e.fsPath)
            )
        ).then(() => {
            this.saveFolders();
            this.lock.acquire('filter', () => {
                for (const folder of _folders) {
                    this.filter = this.filter.filter(
                        e => !e.startsWith(folder)
                    );
                }
            }).then(() => {
                this.saveFilters();
                this.fsp.refresh();
                this.updateContext();
                resetFilesExcludes().then(() => this.updateFilter());
            });
        });
    }

    private async updateContext() {
        vscode.commands.executeCommand('setContext',
            'lucid-workspace:fs.root.length', this.wsFolders.length);
    }

    public addFilter(files:vscode.Uri[]) {
        const _files:string[] = files.map(e => e.fsPath)
        const _wsFolders:string[] = this.wsFolders.map(e => e.fsPath);
        this.logger.info(`Add filter for ${_files}`);
        this.lock.acquire('filter', () => {
            for (let file of _files) {
                if (!this.filter.includes(file)) {
                    this.filter.push(file);
                }
            }
        }).then(() => {
            this.saveFilters();
            this.fsp.refresh();
            this.updateFilter();
        });
    }

    public removeFilter(files:vscode.Uri[]) {
        this.logger.info(`Remove filter for ${files.map(e => e.fsPath)}`);
        let _match:string[] = files.map(e => e.fsPath);
        this.lock.acquire('filter', () =>
            this.filter = this.filter.filter(e => !_match.includes(e))
        ).then(() => {
            this.saveFilters();
            this.fsp.refresh();
            this.updateFilter();
        });
    }

    private async updateFilter() {
        updateFileExcludes(this.wsFolders, this.filter);
    }

    private async saveFolders() {
        let config = vscode.workspace.getConfiguration('lucid-ws');
        config.update('folders', this.wsFolders.map(e => e.fsPath));
    }

    private async saveFilters() {
        let config = vscode.workspace.getConfiguration('lucid-ws');
        config.update('filters', this.filter);
    }

    private async loadState() {
        let config = vscode.workspace.getConfiguration('lucid-ws');
        let folders = config.get<string[]>('folders');
        if (folders) {
            this.wsFolders = folders.map(e => vscode.Uri.file(e));
        }
        let filters = config.get<string[]>('filters');
        if (filters) {
            this.filter = filters;
        }
    }
}

/**
 * @brief
 * wsFoldersQuickPick
 *
 * @param folders Folders to pick from. Defaults to workspace folder
 * @param excludes Paths to exclude
 *
 * @return
 * Promises selected workspace folders 
 */
export function wsFoldersQuickPick(
    folders?:vscode.Uri[],
    excludes?:string[]
):Promise<vscode.Uri[]> {

    if (!folders) {
        folders = vscode.workspace.workspaceFolders?
            [...vscode.workspace.workspaceFolders.map(e => e.uri)]:[];
    }
    let _filtered:vscode.Uri[] | undefined =
        folders.filter(e => excludes?!excludes.includes(e.fsPath):true);
    if (_filtered) {
        if (_filtered.length > 1) {
            return new Promise<vscode.Uri[]>((resolve, reject) => {
                if (_filtered) {
                    vscode.window.showQuickPick(_filtered
                        .map<vscode.QuickPickItem>(e => 
                            ({ "label": basename(e.fsPath), "description": dirname(e.fsPath) })
                    ), {
                        "canPickMany": true,
                        "placeHolder": "Select workspace folders"
                    }).then((value:vscode.QuickPickItem[] | undefined) => {
                        if (value && folders) {
                            resolve(value.map(
                                e => vscode.Uri.parse(join(
                                    e.description?e.description:'', e.label
                                ))
                            ));
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

export function getWsFolderFromPath(
    path:string
):vscode.WorkspaceFolder | undefined {
    if (vscode.workspace.workspaceFolders) {
        for (const f of vscode.workspace.workspaceFolders) {
            if (path.startsWith(f.uri.fsPath)) {
                return f;
            }
        }
    }
}
