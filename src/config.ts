import { join, resolve } from 'path';
import * as vscode from 'vscode';

export async function updateFileExcludes(folders:vscode.Uri[], files:string[]) {
    let excludes: { [id:string]: vscode.FileType } = {};
    let fileExcludes: { [id:string]: boolean } = {};
    let watcherExcludes: { [id:string]: boolean } = {};

    for (const root of folders) {
        Object.assign(excludes, await excludesBuilder(
            root, undefined, files
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
    }

    let config = vscode.workspace.getConfiguration('files');
    config.update('exclude', fileExcludes,
        vscode.ConfigurationTarget.Workspace);
    config.update('watcherExclude', watcherExcludes,
        vscode.ConfigurationTarget.Workspace);
}

async function excludesBuilder(
    root:vscode.Uri,
    folder:string | undefined,
    files:string[]
): Promise<{ [id:string]: vscode.FileType }> {
    let excludes: { [id:string]: vscode.FileType } = {};

    let items = await vscode.workspace.fs.readDirectory(root);
    if (items) {
        for (const item of items) {
            let child:string;
            if (folder) {
                child = join(folder, item[0]);
            } else {
                child = item[0];
            }
            
            if (!files.includes(join(child))) {
                let childInFiles: string[] = files.filter(
                    e => e.startsWith(join(child))
                );

                if (childInFiles.length == 0) {
                    excludes[child] = item[1];
                } else {
                    Object.assign(
                        excludes,
                        await excludesBuilder(
                            vscode.Uri.parse(join(root.fsPath, item[0])),
                            child, childInFiles
                        )
                    );
                }
            }
        }
    }

    return Promise.resolve(excludes);
}
