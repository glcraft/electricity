import * as path from 'path'
import * as fs from 'fs'
import * as pug from 'pug'
import * as bc from './breadcrumb'
import * as utils from './utils'
import {extractIcon} from 'extract-icon'

// = document.getElementsByClassName("explorer")
const tabs = document.getElementsByClassName("tab")
// let currentExplorer = explorers[0]
let currentTabs = tabs[0]

const urlFolderPng=utils.getResourceURL("Folder.png")
const urlFilePng=utils.getResourceURL("File.png")

const pugExplorerItem = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "item.pug"))
const pugTabItem = pug.compileFile(path.join(utils.renderer_path.views, "tabs", "item.pug"))

class FileInfoPug
{
    path: string;
    type: string;
    img: string;
    name: string;
}

class Explorer
{
    private explorer: HTMLElement;
    private tab: HTMLElement;
    private currentPath: string;
    private history:UndoRedo;
    
    constructor(expElem?: HTMLElement, tabElem?:HTMLElement)
    {
        if (expElem)
            this.explorer=expElem
        else
            this.explorer=utils.pugDom('.explorer.explorer-list(data-type="list")') as HTMLElement;
        if (tabElem)
            this.tab=tabElem
        else
        {
            this.tab=utils.stringToDom(pugTabItem({name:""})).firstChild as HTMLElement;
            this.tab.onclick=()=>setCurrentExplorer(this)
        }
        
    }
    getPath(): string 
    {
        return this.currentPath;
    }
    getExplorerElement():HTMLElement
    {
        return this.explorer;
    }
    getTabElement():HTMLElement
    {
        return this.tab;
    }
    goto(pathFolder: string)
    {
        this.currentPath=pathFolder;
        this.update()
    }
    previous()
    {

    }
    next()
    {
        
    }
    up()
    {
        
    }
    public update()
    {
        let t: Array<number>;
        this.currentPath = path.resolve(this.currentPath)
        
        bc.update(this.currentPath);
        this.tab.textContent=utils.getFolderName(this.currentPath)
        fs.readdir(this.currentPath,(err, files)=>{
            if (err)
            {
                console.log(`Erreur lecture du dossier ${this.currentPath}`, err);
                return;
            }
            let lsFilesInfo = new Array<FileInfoPug>();
            for (let iFile = 0;iFile<files.length;++iFile)
            {
                let value = files[iFile];
                let currentFile:FileInfoPug = new FileInfoPug();
                currentFile.path = `${this.currentPath}/${value}`
                currentFile.name = value;
                try {
                    let stats = fs.lstatSync(currentFile.path)
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
                        let b64Icon = extractIcon.geticon(currentFile.path)
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
            utils.clearElement(this.explorer);
            lsFilesInfo.forEach((currentFile)=>{
                let nodeFile = utils.stringToDom(pugExplorerItem(currentFile));
                if (currentFile.type=="dir")
                    (nodeFile.childNodes[0] as HTMLElement).ondblclick = ()=>{
                        gotoFolder(currentFile.path)
                    }
                    this.explorer.append(nodeFile)
            })
        });
    }
}

let explorers: Array<Explorer> = new Array<Explorer>();
let currentExplorer:Explorer;
let sassExplorer = document.getElementById("sass-explorer")

export function gotoFolder(currentPath: string)
{
    currentExplorer.goto(currentPath)
}
export function previous()
{
    console.log("prev")
    // currentExplorer.previous()
}
export function next()
{
    console.log("next")
    // currentExplorer.next()
}
export function up()
{
    console.log("up")
    // currentExplorer.up()
}
export function setCurrentExplorer(exp: Explorer|number)
{
    if (sassExplorer.hasChildNodes())
        sassExplorer.removeChild(currentExplorer.getExplorerElement())
    if (currentExplorer)
        currentExplorer.getTabElement().classList.remove("selected")
    if (typeof exp === "number")
        currentExplorer = explorers[exp]
    else
        currentExplorer = exp;
    currentExplorer.getTabElement().classList.add("selected")
    sassExplorer.appendChild(currentExplorer.getExplorerElement())
    currentExplorer.update()
}

//INITIAL
let vPaths:Array<string>;
if (process.platform==="win32")
{
    vPaths=[
        process.cwd(),
        process.env.SystemDrive+path.sep,
        process.env.HOMEDRIVE+process.env.HOMEPATH
    ]
}
let i=0;
let tabsBar=document.getElementById("tab-bar")
vPaths.forEach((p)=>{
    
    let exp = new Explorer()
    exp.getTabElement().innerText = utils.getFolderName(p)
    tabsBar.appendChild(exp.getTabElement())
    exp.goto(p)
    explorers.push(exp)
    ++i
})



let navElem=document.getElementById("nav");
["previous", "next", "up"].forEach(element => {
    let urlimg = utils.getResourceURL(`nav/${element}.png`)
    let nodeNavBut = utils.pugDom(`img(src="${urlimg}")`) as HTMLElement
    nodeNavBut.onclick=exports[element]
    navElem.appendChild(nodeNavBut)
});
setCurrentExplorer(0)