import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 
import { AllFoldersProvider } from './allFoldersProvider';

/**
 * Class for Folder Manager
 */
export class FolderManager {
    private logger: Logger = getLogger();
    private afp:AllFoldersProvider | undefined = undefined;

    constructor (public wsFolders?:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing folder manager');
        if (wsFolders) {
            this.initAFP(wsFolders);
        }
    }

    private initAFP(wsFolders:vscode.WorkspaceFolder[]) {
        if (!this.afp) {
            this.afp = new AllFoldersProvider(wsFolders);
            vscode.window.registerTreeDataProvider('all-folders', this.afp);
        }
    }
}
