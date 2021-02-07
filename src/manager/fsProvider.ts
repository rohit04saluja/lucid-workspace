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
            .filter(e => all ? true: !e.name.startsWith('.')
            ).map(e => e.name);
    } else {
        return [];
    }
}

/**
 * Class for FsProvider
 */
export class FsProvider 
    implements vscode.TreeDataProvider<FsTreeItem> {

    private _onDidChangeTreeData
        :vscode.EventEmitter<FsTreeItem | undefined> =
        new vscode.EventEmitter<FsTreeItem | undefined>();
    readonly onDidChangeTreeData:vscode.Event<FsTreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private logger:Logger = getLogger();
    private root:FsTreeItem[] = [];

    constructor(wsFolders:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing all folders tree provider');
        this.root = wsFolders.map(e => new FsTreeItem(
            e.name, e.uri.fsPath
        ));
    }

    getTreeItem(element:FsTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?:FsTreeItem):Promise<FsTreeItem[]> {
        let items:FsTreeItem[] = [];
        if (element) {
            if (element instanceof FsTreeItem) {
                items = getChildren(element.path)
                    .map(e => new FsTreeItem(
                        e, join(element.path, e)
                    ));
            }
        } else {
            items = this.root;
        }
        return Promise.resolve(items);
    }
}

/**
 * Class for FsTreeItem
 */
class FsTreeItem extends vscode.TreeItem {
    private _collapseibleState:vscode.TreeItemCollapsibleState | undefined =
        undefined;
    // TODO: Add icon path as per the file extension

    constructor(label:string, public path:string) {
        super(label);
        this.tooltip = this.id = this.path;
        this.collapsibleState = lstatSync(this.path).isDirectory()
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;
    }
}
