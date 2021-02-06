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

    constructor(private wsFolders:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing all folders tree provider');
    }

    getTreeItem(element:AllFolderTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?:AllFolderTreeItem):Promise<AllFolderTreeItem[]> {}
}

class AllFolderTreeItem extends vscode.TreeItem {}

