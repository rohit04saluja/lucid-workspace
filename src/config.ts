import { join, resolve } from 'path';
import * as vscode from 'vscode';

export async function resetFilesExcludes() {
    let config = vscode.workspace.getConfiguration('files');
    config.update('exclude', {}, vscode.ConfigurationTarget.Workspace);
    config.update('watcherExclude', {}, vscode.ConfigurationTarget.Workspace);
}

export async function updateFileExcludes(root:vscode.Uri, files:string[]) {
    let excludes: { [id:string]: vscode.FileType } = {};
    let fileExcludes: { [id:string]: boolean } = {};
    let watcherExcludes: { [id:string]: boolean } = {};

    Object.assign(excludes, await excludesBuilder(
        root, '', files
    ));

    for (let key of Object.keys(excludes)) {
        let fType:vscode.FileType = excludes[key];
        fileExcludes[key] = true;
        key = resolve(root.fsPath, key);
        if (fType == vscode.FileType.Directory) {
            watcherExcludes[join(key, '**')] = true;
        } else {
            watcherExcludes[key] = true;
        }
    }

    let config = vscode.workspace.getConfiguration('files');
    config.update('exclude', fileExcludes,
        vscode.ConfigurationTarget.Workspace);
    config.update('watcherExclude', watcherExcludes,
        vscode.ConfigurationTarget.Workspace);
}

async function excludesBuilder(
    root:vscode.Uri,
    folder:string = '',
    files:string[] = []
): Promise<{ [id:string]: vscode.FileType }> {
    if (vscode.FileType.Directory != 
        (await vscode.workspace.fs.stat(root)).type) {
        return Promise.resolve({});
    }

    let excludes: { [id:string]: vscode.FileType } = {};

    let items = await vscode.workspace.fs.readDirectory(
        vscode.Uri.file(join(root.fsPath, folder))
    );
    if (items) {
        for (const item of items) {
            let child:string = join(folder, item[0]);
            let childPath:string = join(root.fsPath, child);
            
            if (!files.includes(childPath)) {
                let childInFiles: string[] = files.filter(
                    e => e.startsWith(childPath)
                );

                if (childInFiles.length == 0) {
                    excludes[child] = item[1];
                } else {
                    Object.assign(
                        excludes,
                        await excludesBuilder(
                            vscode.Uri.parse(join(root.fsPath)),
                            child, childInFiles
                        )
                    );
                }
            }
        }
    }

    return Promise.resolve(excludes);
}
