import { lstatSync, readdirSync, realpathSync } from 'fs';
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
function getChildren(path:vscode.Uri, all:boolean=false):string[] {
    let _path:string;
    if (lstatSync(path.fsPath).isSymbolicLink()) {
        _path = realpathSync(path.fsPath);
    } else {
        _path = path.fsPath;
    }
    if (lstatSync(_path).isDirectory()) {
        return readdirSync(_path, { withFileTypes: true })
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
            e.uri
        ));
    }

    getTreeItem(element:FsTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?:FsTreeItem):Promise<FsTreeItem[]> {
        let items:FsTreeItem[] = [];
        if (element) {
            items = getChildren(element.resourceUri)
                .map(e => new FsTreeItem(vscode.Uri.parse(join(element.resourceUri.fsPath, e))));
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
    constructor(public resourceUri:vscode.Uri) {
        super(resourceUri);
        const _lstat = lstatSync(this.resourceUri.fsPath);
        if (_lstat.isSymbolicLink()
            && lstatSync(realpathSync(this.resourceUri.fsPath)).isDirectory()) {

            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        } else if (_lstat.isDirectory()) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        if (this.collapsibleState == undefined) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
    }
}
