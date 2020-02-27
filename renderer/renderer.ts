import {IconStorage, iconManager} from './icons'
import * as utils from './utils'
import * as vsicons from 'vscode-icons-js';
import { FileInfo } from './explorer';
import { extractIcon } from 'internal_module'
class ExecutableIcons implements IconStorage
{
    getIcon(itemInfo: FileInfo, iconsize: number): string|undefined
    {
        if (itemInfo.type=="file" && /\.(?:exe|scr|cmd)$/.test(itemInfo.name))
        {
            let b64Icon = extractIcon(itemInfo.path)
            return `data:image/png;base64,${b64Icon}`;
        }
        return undefined;
    }
}
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
iconManager.registerIconStorage(new ExecutableIcons)

import './explorer'

document.querySelector<HTMLImageElement>("#caption-close").src = utils.getResourceURL("caption/Close.svg")
document.querySelector<HTMLImageElement>("#caption-max").src = utils.getResourceURL("caption/Maximize.svg")
document.querySelector<HTMLImageElement>("#caption-reduce").src = utils.getResourceURL("caption/Reduce.svg")

const firstPath = process.cwd()
