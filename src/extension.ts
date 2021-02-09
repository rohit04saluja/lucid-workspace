import * as vscode from 'vscode';
import { Logger, getLogger } from './logger';
import { FsManager, wsFoldersQuickPick } from './manager/manager';

let ex:LucidWorkspace | undefined = undefined;

/** this method is called when your extension is activated */
export function activate(context: vscode.ExtensionContext) {
    ex = new LucidWorkspace(context);
}

/** this method is called when your extension is deactivated */
export function deactivate() {
    ex?.destructor();
    ex = undefined;
}

/** Class for the extension */
class LucidWorkspace {
    private log:Logger = getLogger();
    private fsManager:FsManager | undefined = undefined;

    constructor(private context:vscode.ExtensionContext) {
        this.log.info('Lucid workspace is activated');
        this.fsManager = new FsManager(this.context);

        /** Register commands */
        let _d:vscode.Disposable;
        /** Register enable command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.enable',
            () => this.enable()
        );
        this.context.subscriptions.push(_d);

        /** Register disble command */
        _d = vscode.commands.registerCommand(
            'lucid-workspace.disable',
            () => this.disable()
        );

        this.setContext('activate');
    }

    destructor() {
        this.log.info('Lucid workspace is deactivated');
        this.disable();
        this.setContext('');
    }

    enable() {
        this.log.info(`Lucid Workspace is enabling now`);
        //this.fsManager?.enable();
        this.setContext('enable');
    }

    disable() {
        this.log.info('Lucid Workspace is diabling now');
        //this.fsManager?.disable();
        this.setContext('activate');
    }

    private setContext(state:string) {
        vscode.commands.executeCommand('setContext', 'lucid-workspace:state',
            state);
    }
}
