import {IconStorage, iconManager} from './icons'
import * as vsicons from 'vscode-icons-js';
import { FileInfo } from './explorer';
class VSCodeIcons implements IconStorage
{
    getIcon(itemInfo: FileInfo, iconsize: number): string|undefined
    {
        // https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/default_root_folder.svg
        let img:string;
        if (itemInfo.type=="dir")
            img = vsicons.getIconForFolder(itemInfo.name)
        else if (itemInfo.type=="file")
            img = vsicons.getIconForFile(itemInfo.name)
        else
            return undefined
        if (/^default_/.test(img))
            return undefined
        return `https://github.com/vscode-icons/vscode-icons/raw/master/icons/${img}?sanitize=true`
    }
}
iconManager.registerIconStorage(new VSCodeIcons)

import './explorer'

const firstPath = process.cwd()
