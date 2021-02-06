import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 

/**
 * Class for Folder Manager
 */
export class FolderManager {
    private logger: Logger;

    constructor (public wsFolders?:vscode.WorkspaceFolder[]) {
        this.logger = getLogger();
        this.logger.info('Initializing folder manager');
    }
}
