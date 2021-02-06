import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { getLogger, Logger } from '../logger';

/**
 * @brief
 * getDirs
 * 
 * @description
 * Get all directories inside the given path
 * 
 * @param path
 * Path to read
 *
 * @return
 * A list of all directories inside the given path
 */
function getChildren(path:string, all:boolean=false):string[] {
    if (lstatSync(path).isDirectory()) {
        return readdirSync(path, { withFileTypes: true })
            .filter(e => all?true:!e.name.startsWith('.')).map(e => e.name);
    } else {
        return [];
    }
}

/**
 * Class for allFoldersProvider
 */
export class AllFoldersProvider 
    implements vscode.TreeDataProvider<AllFolderTreeItem> {

    private _onDidChangeTreeData
        :vscode.EventEmitter<AllFolderTreeItem | undefined> =
        new vscode.EventEmitter<AllFolderTreeItem | undefined>();
    readonly onDidChangeTreeData:vscode.Event<AllFolderTreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private logger:Logger = getLogger();
    private root:WsFolderTreeItem[] = [];

    constructor(wsFolders:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing all folders tree provider');
        this.root = wsFolders.map(e => new WsFolderTreeItem(e));
    }

    getTreeItem(element:AllFolderTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?:AllFolderTreeItem):Promise<AllFolderTreeItem[]> {
        let items:AllFolderTreeItem[] = [];
        if (element) {
            if (element instanceof WsFolderTreeItem) {
                items = getChildren(element.wsFolder.uri.fsPath)
                    .map(e => new FsTreeItem(
                        e, join(element.wsFolder.uri.fsPath, e)
                    ));
            }
        } else {
            items = this.root;
        }
        return Promise.resolve(items);
    }
}

abstract class AllFolderTreeItemAbstract extends vscode.TreeItem {
    abstract collapsibleState: vscode.TreeItemCollapsibleState;
}

class AllFolderTreeItem extends AllFolderTreeItemAbstract {
    private _collapseibleState:vscode.TreeItemCollapsibleState | undefined =
    undefined;

    constructor(label:string, public path:string) {
        super(label);
        this.tooltip = this.path;
    }

    get collapsibleState():vscode.TreeItemCollapsibleState {
        let dirs:string[] = getChildren(this.path);
        if (dirs.length > 0) {
            if (this._collapseibleState) {
                return this._collapseibleState;
            } else {
                return vscode.TreeItemCollapsibleState.Collapsed;
            }
        } else {
            return vscode.TreeItemCollapsibleState.None;
        }
    }

    set collapsibleState(state:vscode.TreeItemCollapsibleState) {
        this._collapseibleState = state;
    }
}

class WsFolderTreeItem extends AllFolderTreeItem {
    public iconPath = new vscode.ThemeIcon('folder-opened');

    constructor(public wsFolder:vscode.WorkspaceFolder) {
        super(wsFolder.name, wsFolder.uri.fsPath);
    }
}

class FsTreeItem extends AllFolderTreeItem {
    private _collapsibleState:vscode.TreeItemCollapsibleState | undefined =
        undefined;
    constructor(name:string, public path:string) {
        super(name, path);
    }
}
