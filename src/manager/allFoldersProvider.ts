import { readdirSync } from 'fs';
import * as vscode from 'vscode';
import { getLogger, Logger } from '../logger';

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
            items.push(element);
        } else {
            items = this.root;
        }
        return Promise.resolve(items);
    }
}

abstract class AllFolderTreeItem extends vscode.TreeItem {
    abstract collapsibleState: vscode.TreeItemCollapsibleState;
}

class WsFolderTreeItem extends AllFolderTreeItem {
    private _collapseibleState:vscode.TreeItemCollapsibleState | undefined =
        undefined;

    constructor(public wsFolder:vscode.WorkspaceFolder) {
        super(wsFolder.name);
    }

    get collapsibleState():vscode.TreeItemCollapsibleState {
        let dirs:string[] = readdirSync(
            this.wsFolder.uri.fsPath,
            { withFileTypes: true }
        ).filter(e => e.isDirectory()).map(e => e.name);
        if (dirs.length) {
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

class FolderTreeItem implements AllFolderTreeItem {}