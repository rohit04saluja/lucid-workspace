import * as vscode from 'vscode';
import { getLogger } from './logger';
import { FsManager, wsFoldersQuickPick } from './manager/manager';

let fsMan:FsManager;

/** this method is called when your extension is activated */
export function activate(context: vscode.ExtensionContext) {
    getLogger().info('Lucid workspace is activated');
    fsMan = new FsManager(context);
}

/** this method is called when your extension is deactivated */
export function deactivate() {
    getLogger().info('Lucid workspace is deactivated');
    fsMan.deactivate();
}
