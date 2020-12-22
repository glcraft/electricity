import {IconStorage, iconManager} from './icons'
import * as utils from './utils'
import * as vsicons from 'vscode-icons-js';
import * as fs from 'fs';
import * as pug from 'pug';
import * as path from 'path';
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
        if (/^default_/.test(img) && itemInfo.type=="file")
            return undefined
        return `https://github.com/vscode-icons/vscode-icons/raw/master/icons/${img}?sanitize=true`
    }
}
iconManager.registerIconStorage(new VSCodeIcons)
iconManager.registerIconStorage(new ExecutableIcons)

import './explorer'
import { remote } from 'electron';

let elCapClose = document.querySelector<HTMLDivElement>("#caption-close");
let elCapMax = document.querySelector<HTMLDivElement>("#caption-max");
let elCapRed = document.querySelector<HTMLDivElement>("#caption-reduce");
let elCapMaxImg = elCapMax.querySelector<HTMLImageElement>("img");
elCapClose.querySelector<HTMLImageElement>("img").src = utils.getResourceURL("caption/Close.svg");
elCapMax.querySelector<HTMLImageElement>("img").src = utils.getResourceURL("caption/Maximize.svg");
elCapRed.querySelector<HTMLImageElement>("img").src = utils.getResourceURL("caption/Reduce.svg");
let currentWin = remote.getCurrentWindow()
elCapClose.onclick=e=>{
    currentWin.close();
}
elCapMax.onclick=e=>{
    if (!currentWin.isMaximized())
        currentWin.maximize();
    else
        currentWin.unmaximize();
}
elCapRed.onclick=e=>{
    currentWin.minimize();
}
currentWin.on("maximize", e=>{
    elCapMaxImg.src = utils.getResourceURL("caption/Minimize.svg");
})
currentWin.on("unmaximize", e=>{
    elCapMaxImg.src = utils.getResourceURL("caption/Maximize.svg");
})
const firstPath = process.cwd()

const pugBMItem = pug.compileFile(path.join(utils.renderer_path.views, "bookmark", "item.pug"));
function make_bookmark(dirpath: string)
{
    let dirname = utils.getFolderName(dirpath);
    const test = {fileinfo:{name: dirname, icon: ""}, arrow_img: utils.getResourceURL("breadcrumb_sep.png")}
    let htmlBM = pugBMItem(test)
    let elBM = utils.stringToDom(htmlBM)
    const elIcon = (elBM as HTMLElement).querySelector<HTMLImageElement>(".icon")
    iconManager.getIcon({
        icon: "",
        path: dirpath,
        type: "dir",
        name: dirname,
        stat: new fs.Stats
    }, 24).then(v=>{
        elIcon.src = v;
    })
    document.querySelector("#bookmark").append(elBM)
}
make_bookmark("C:/Users")
make_bookmark("D:/")
make_bookmark(process.cwd())