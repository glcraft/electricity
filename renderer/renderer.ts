import * as fs from 'fs'
import * as path from 'path'
import * as uuid from 'uuid/v4'
import {extractIcon} from 'extract-icon'
import * as utils from './utils'
import * as pug from 'pug'
import * as bc from './breadcrumb'


const explorers = document.getElementsByClassName("explorer")
let currentExplorer = explorers[0]
let geticon=extractIcon

const firstPath = process.cwd()

const urlFolderPng=utils.getResourceURL("Folder.png")
const urlFilePng=utils.getResourceURL("File.png")

class FileInfoPug
{
    type: string;
    img: string;
    name: string;
}

function gotoFolder(currentPath: string)
{
    const pugItem = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "item.pug"))
    currentPath = path.resolve(currentPath)
    
    bc.update(currentPath);
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
            let stats = fs.lstatSync(pathItem)
            currentFile.name = value;
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
                let b64Icon = geticon.geticon(`${currentPath}/${value}`)
                currentFile.img=`data:image/png;base64,${b64Icon}`;
                currentFile.type="file"
            }
            lsFilesInfo.push(currentFile)
        }
        utils.stable_partition(lsFilesInfo, v=>v.type=="dir")
        lsFilesInfo.forEach((currentFile)=>{currentExplorer.append(utils.stringToDom(pugItem(currentFile)))})
    });
    
}

currentExplorer.classList.add("explorer-list");
(currentExplorer as HTMLElement).dataset.type="list"
gotoFolder(firstPath)