import AsyncLock = require('async-lock');
import { lstatSync, readdirSync, realpathSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { getLogger, Logger } from '../logger';

/**
 * Class for FsProvider
 */
export class FsProvider implements vscode.TreeDataProvider<FsTreeItem> {
    private _onDidChangeTreeData:vscode.EventEmitter<FsTreeItem | undefined> =
        new vscode.EventEmitter<FsTreeItem | undefined>();
    readonly onDidChangeTreeData:vscode.Event<FsTreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private logger:Logger = getLogger();
    private root:FsTreeItem[] = [];
    private lock = new AsyncLock();

    constructor(wsFolders?:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing fs tree provider');
        if (wsFolders) {
            this.addFolders(wsFolders);
        }
    }

    getTreeItem(element:FsTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?:FsTreeItem):Promise<FsTreeItem[]> {
        let items:FsTreeItem[] = [];
        if (element) {
            const _path:string = realpathSync(element.resourceUri.fsPath)
            if (lstatSync(_path).isDirectory()) {
                items = readdirSync(_path)
                    .filter(e => !e.startsWith('.'))
                    .map(e => new FsTreeItem(vscode.Uri.parse(join(_path, e))));
            }
        } else {
            items = this.root;
        }
        return Promise.resolve(items);
    }

    // TODO: Need syncronization for root updates
    async addFolders(folders:vscode.WorkspaceFolder[]) {
        this.lock.acquire('root', () => {
            this.root = this.root.concat(
                folders.map(e => new FsTreeItem(e.uri))
            );
        }).then(() => {
            this.update();
        });
    }

    async removeFolders(folders:vscode.WorkspaceFolder[]) {
        let _match:string[] = folders.map(e => e.uri.fsPath);
        this.lock.acquire('root', () => {
            this.root = this.root.filter(
                e => _match.includes(e.resourceUri.fsPath)?false:true
            );
        }).then(() => {
            this.update();
        });
    }

    async update() {
        this._onDidChangeTreeData.fire(undefined);
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
