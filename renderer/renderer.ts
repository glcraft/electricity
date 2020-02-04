import * as fs from 'fs'
import * as path from 'path'
import * as uuid from 'uuid/v4'
import {extractIcon} from 'extract-icon'
import * as utils from './utils'
import * as bc from './breadcrumb'


let expl = document.getElementsByClassName("explorer")
let geticon=extractIcon

const firstPath = `${process.cwd()}`



const urlFolderPng=utils.getResourceURL("Folder.png")
const urlFilePng=utils.getResourceURL("File.png")

class FileInfoPug
{
    type: string;
    img: string;
}

function gotoFolder(currentPath: string)
{
    currentPath = path.resolve(currentPath)
    let lsFilesToPug = new Array<FileInfoPug>();
    fs.readdir(currentPath,(err, files)=>{
        if (err)
        {
            console.log(`Erreur lecture du dossier ${currentPath}`, err);
            return;
        }
        for (let iFile = 0;iFile<files.length;++iFile)
        {
            let value = files[iFile];
            let currentFile:FileInfoPug = new FileInfoPug();
            let pathItem = `${currentPath}/${value}`
            let stats = fs.lstatSync(pathItem)
            if (err)
                currentFile.type="unknown"
            else if (stats.isDirectory())
            {
                currentFile.img=urlFolderPng
                currentFile.type="dir"
            }
            else
            {
                currentFile.img=urlFilePng
                currentFile.type="file"
            }
            lsFilesToPug.push(currentFile)
        }
        ///PARTITION FOLDER/FILE
        {
            let b = expl[0].children
            let i2=0
            for(let i1=0;i1<b.length;i1++)
            {
                let v=b[i1] as HTMLElement;
                if (v.dataset.type=="dir")
                {
                    expl[0].insertBefore(b[i1], b[i2]);
                    i2++
                }
            }
        }
        bc.update(currentPath);    
    });
    
}
gotoFolder(firstPath)