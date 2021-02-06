import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 
import { FsProvider as FsProvider } from './fsProvider';

/**
 * Class for Folder Manager
 */
export class FolderManager {
    private logger: Logger = getLogger();
    private fsp:FsProvider | undefined = undefined;

    constructor (public wsFolders?:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing folder manager');
        if (wsFolders) {
            this.initAFP(wsFolders);
        }
    }

    private initAFP(wsFolders:vscode.WorkspaceFolder[]) {
        if (!this.fsp) {
            this.fsp = new FsProvider(wsFolders);
            vscode.window.registerTreeDataProvider('all-folders', this.fsp);
        }
    }
}
