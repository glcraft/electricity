import * as path from 'path'
import * as fs from 'fs'
import * as pug from 'pug'
import * as bc from './breadcrumb'
import * as utils from './utils'
import {extractIcon} from 'extract-icon'

const explorers = document.getElementsByClassName("explorer")
const tabs = document.getElementsByClassName("tab")
let currentExplorer = explorers[0]
let currentTabs = tabs[0]

const urlFolderPng=utils.getResourceURL("Folder.png")
const urlFilePng=utils.getResourceURL("File.png")

//INITIAL
currentExplorer.classList.add("explorer-list");
(currentExplorer as HTMLElement).dataset.type="list"

class FileInfoPug
{
    type: string;
    img: string;
    name: string;
}

export function gotoFolder(currentPath: string)
{
    utils.clearElement(currentExplorer);
    const pugItem = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "item.pug"))
    currentPath = path.resolve(currentPath)
    
    bc.update(currentPath);
    currentTabs.textContent=utils.getFolderName(currentPath)
    fs.readdir(currentPath,(err, files)=>{
        if (err)
        {
            console.log(`Erreur lecture du dossier ${currentPath}`, err);
            return;
        }
        let lsFilesInfo = new Array<FileInfoPug>();
        for (let iFile = 0;iFile<files.length;++iFile)
        {
            let value = files[iFile];
            let currentFile:FileInfoPug = new FileInfoPug();
            let pathItem = `${currentPath}/${value}`
            try {
                currentFile.name = value;
                let stats = fs.lstatSync(pathItem)
                if (err)
                {
                    currentFile.img = urlFilePng
                    currentFile.type="unknown"
                }
                else if (stats.isDirectory())
                {
                    currentFile.img=urlFolderPng
                    currentFile.type="dir"
                }
                else
                {
                    let b64Icon = extractIcon.geticon(`${currentPath}/${value}`)
                    currentFile.img=`data:image/png;base64,${b64Icon}`;
                    currentFile.type="file"
                }
            }
            catch (err)
            {
                currentFile.img = urlFilePng
                currentFile.type="unknown"
            }
            
            lsFilesInfo.push(currentFile)
        }
        utils.stable_partition(lsFilesInfo, v=>v.type=="dir")
        lsFilesInfo.forEach((currentFile)=>{currentExplorer.append(utils.stringToDom(pugItem(currentFile)))})
    });
    
}