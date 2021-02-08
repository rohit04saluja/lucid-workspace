import * as vscode from 'vscode';
import { Logger, getLogger } from '../logger' 
import { FsProvider } from './fsTree';

/**
 * Class for Folder Manager
 */
export class FsManager {
    private logger: Logger = getLogger();
    private fsp:FsProvider | undefined = undefined;

    constructor (private context:vscode.ExtensionContext,
                 public wsFolders?:vscode.WorkspaceFolder[]) {
        this.logger.info('Initializing folder manager');
        if (wsFolders) {
            this.initAFP(wsFolders);
        }

        let _d:vscode.Disposable;
        /** Register add to active command */
        _d = vscode.commands.registerCommand(
            'workspaces.add-to-active',
            (files:vscode.Uri) => {
                this.logger.info(`Add to active is called with ${files}`);
            }
        );
        this.context.subscriptions.push(_d);
    }

    private initAFP(wsFolders:vscode.WorkspaceFolder[]) {
        if (!this.fsp) {
            this.fsp = new FsProvider(wsFolders);
            vscode.window.registerTreeDataProvider('fs', this.fsp);
        }
    }
}
