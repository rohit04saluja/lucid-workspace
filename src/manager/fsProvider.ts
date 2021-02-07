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
            .filter(e => e.isDirectory() 
                && (all ? true: !e.name.startsWith('.'))
            ).map(e => e.name);
    } else {
        return [];
    }
}

/**
 * Class for allFoldersProvider
 */
export class FsProvider 
    implements vscode.TreeDataProvider<FolderTreeItem> {

    private _onDidChangeTreeData
        :vscode.EventEmitter<FolderTreeItem | undefined> =
        new vscode.EventEmitter<FolderTreeItem | undefined>();
    readonly onDidChangeTreeData:vscode.Event<FolderTreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private logger:Logger = getLogger();
    private root:FolderTreeItem[] = [];

    constructor(wsFolders:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing all folders tree provider');
        this.root = wsFolders.map(e => new FolderTreeItem(
            e.name, e.uri.fsPath
        ));
    }

    getTreeItem(element:FolderTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?:FolderTreeItem):Promise<FolderTreeItem[]> {
        let items:FolderTreeItem[] = [];
        if (element) {
            if (element instanceof FolderTreeItem) {
                items = getChildren(element.path)
                    .map(e => new FolderTreeItem(
                        e, join(element.path, e)
                    ));
            }
        } else {
            items = this.root;
        }
        return Promise.resolve(items);
    }
}

abstract class FolderTreeItemAbstract extends vscode.TreeItem {
    abstract collapsibleState: vscode.TreeItemCollapsibleState;
}

class FolderTreeItem extends FolderTreeItemAbstract {
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
