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
    public wsFolder: vscode.Uri | undefined;
    public filter:Set<string> = new Set();

    constructor(public context:vscode.ExtensionContext,) {
        this.logger.info('Initializing folder manager');
        this.loadState();
        this.updateContext();
        this.updateFilter();

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
            async (folder?:vscode.Uri, overwrite?: boolean) => {
                if (this.wsFolder && (overwrite == undefined)) {
                    const val = await vscode.window.showWarningMessage(
                        `Are you sure you want to overwrite ${this.wsFolder}?`,
                        { modal: true }, ...['Yes']
                    );
                    if (val == 'Yes') overwrite = true;
                    else return Promise.resolve();
                } else if (overwrite == undefined) overwrite = true;

                if (
                    (
                        vscode.workspace.workspaceFolders &&
                        (vscode.workspace.workspaceFolders.length > 0)
                    ) && overwrite
                ) {
                    if (folder) {
                        this.logger.info(`Add ${folder} to lucid`);
                        /** Check if this folder exists in workspace folders */
                        if (getWsFolder(folder.fsPath)) {
                            return this.addWsFolder(folder);
                        } else {
                            vscode.window.showErrorMessage(
                                `${folder} is not a workspace folder. Open folder in vscode to add to Lucid`
                            );
                            return Promise.reject(`${folder} is not a workspace folder`);
                        }
                    } else {
                        const item = vscode.workspace.workspaceFolders.map<vscode.QuickPickItem>(e => ({
                            "label": basename(e.uri.fsPath),
                            "description": dirname(e.uri.fsPath)
                        }));
                        if (item.length > 1) {
                            const val = await vscode.window.showQuickPick(
                                vscode.workspace.workspaceFolders
                                    .map<vscode.QuickPickItem>(e => ({
                                        "label": basename(e.uri.fsPath),
                                        "description": dirname(e.uri.fsPath)
                                    })), {
                                        "placeHolder": "Select workspace folder"
                                    }
                            );
                            if (val) {
                                return this.addWsFolder(vscode.Uri.parse(join(
                                    val.description? val.description: '', val.label
                                )));
                            }
                        } else {
                            return this.addWsFolder(vscode.Uri.parse(join(
                                item[0].description? item[0].description: '',
                                item[0].label
                            )));
                        }
                        return Promise.resolve();
                    }
                }
                return Promise.reject();
            }
        );
        this.context.subscriptions.push(_d);

        /** Register remove ws folders command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.remove-ws-folders',
            () => {
                this.logger.info(`Remove ws folder called`);
                this.removeWsFolder();
            }
        );
        this.context.subscriptions.push(_d);
    }

    deactivate() {
        this.logger.info('FsManager is being deactived');
        this.removeWsFolder();
    }

    public async addWsFolder(folder:vscode.Uri): Promise<void> {
        this.logger.info(`Add ${folder} to FS manager`);
        this.wsFolder = folder;
        this.saveFolders();
        this.fsp.refresh();
        this.updateContext();
        this.updateFilter();
        return Promise.resolve();
    }

    public removeWsFolder() {
        this.wsFolder = undefined;
        this.saveFolders();

        /** Filter out paths of removed folders */
        this.filter.clear();
        this.saveFilters();

        this.fsp.refresh();
        this.updateContext();
        resetFilesExcludes().then(() => this.updateFilter());
    }

    private async updateContext() {
        vscode.commands.executeCommand('setContext',
            'lucid-workspace:fs.hasRoot', this.wsFolder? true: false);
    }

    public addFilter(files:vscode.Uri[]) {
        const _files:string[] = files.map(e => e.fsPath)
        this.logger.info(`Add filter for ${_files}`);
        for (const file of _files) this.filter.add(file);
        this.saveFilters();
        this.fsp.refresh();
        this.updateFilter();
    }

    public removeFilter(files?:vscode.Uri[]) {
        if (files) {
            this.logger.info(`Remove filter for ${files.map(e => e.fsPath)}`);
            for (const f of files) this.filter.delete(f.fsPath);
        } else {
            this.logger.info(`Remove all filters`);
            this.filter.clear();
        }

        this.saveFilters();
        this.fsp.refresh();
        this.updateFilter();
    }

    private async updateFilter() {
        if (this.wsFolder) {
            updateFileExcludes(this.wsFolder, Array.from(this.filter));
        }
    }

    private async saveFolders() {
        vscode.workspace.getConfiguration('lucid-ws').update(
            'folder', this.wsFolder? this.wsFolder.fsPath: ''
        );
    }

    private async saveFilters() {
        let config = vscode.workspace.getConfiguration('lucid-ws');
        config.update('filters', this.filter);
    }

    private async loadState() {
        let config = vscode.workspace.getConfiguration('lucid-ws');
        let folder = config.get<string>('folders');
        if (folder) this.wsFolder = vscode.Uri.file(folder);

        let filters = config.get<string[]>('filters');
        if (filters) this.filter = new Set(filters);
    }
}

export function getWsFolder(
    path: string, exact: boolean = true
): vscode.WorkspaceFolder | undefined
{
    if (vscode.workspace.workspaceFolders) {
        for (const f of vscode.workspace.workspaceFolders) {
            if (
                (exact && path.startsWith(f.uri.fsPath)) ||
                (!exact && path == f.uri.fsPath)
            ) {
                return f;
            }
        }
    }
}
