import AsyncLock = require('async-lock');
import { lstatSync, readdirSync, realpathSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { getLogger, Logger } from '../logger';
import { FsManager, getWsFolderFromPath } from './manager';

/**
 * Class for FsProvider
 */
export class FsProvider implements vscode.TreeDataProvider<FsTreeItem> {
    private _onDidChangeTreeData:vscode.EventEmitter<FsTreeItem | undefined> =
        new vscode.EventEmitter<FsTreeItem | undefined>();
    readonly onDidChangeTreeData:vscode.Event<FsTreeItem | undefined> =
        this._onDidChangeTreeData.event;

    private logger:Logger = getLogger();
    private lock = new AsyncLock();

    constructor(private readonly manager: FsManager) {
        this.logger.info('Initializing fs tree provider');

        this.manager.context.subscriptions.push(
            vscode.commands.registerCommand(
                'lucid-workspace.refresh-fs',
                (node:FsTreeItem | undefined) => this.refresh(node)
            )
        );
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
                    .filter(
                        e => !e.startsWith('.') && !this.filter(join(_path, e))
                    ).map(
                        e => new FsTreeItem(vscode.Uri.parse(join(_path, e)))
                    );
            }
        } else {
            items = this.manager.wsFolders.map(e => new FsTreeItem(e));
        }
        return Promise.resolve(items);
    }

    async refresh(item?:FsTreeItem) {
        this._onDidChangeTreeData.fire(item);
    }

    private filter(path:string):boolean {
        const wsFolder = getWsFolderFromPath(path)?.uri.fsPath;
        if (wsFolder) {
            return this.manager.filter[wsFolder].includes(path)
        }
        return false;
    }
}

/**
 * Class for FsTreeItem
 */
export class FsTreeItem extends vscode.TreeItem {
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
