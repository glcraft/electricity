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
class HistoryData
{
    path: string
}
class ExplorerHistory {
    
    readonly length: number;
    scrollRestoration: ScrollRestoration;
    readonly state: any;
    private hist : Array<HistoryData> = new Array<HistoryData>()
    private currentpos:number = -1;
    private stocksize:number = 0;

    onChangeHistory:(d:HistoryData)=>void;
    
    back(): void
    {
        this.go(-1)
    }

    forward(): void
    {
        this.go(1)
    }
    go(delta?: number): void
    {
        let oldpos = this.currentpos
        this.currentpos=Math.max(0, Math.min(this.hist.length-1, this.currentpos+delta));
        if (this.currentpos!==oldpos)
            this.onChangeHistory(this.hist[this.currentpos])
    }
    pushState(path: string): void
    {
        ++this.currentpos
        this.hist.length=this.currentpos
        this.hist.push({path: path})
    }
    // replaceState(path: string): void
    // {
        
    // }
}

class Explorer
{
    private explorer: HTMLElement;
    private tab: HTMLElement;
    private currentPath: string;
    private history:ExplorerHistory = new ExplorerHistory();
    
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
            let test=pugTabItem({name:""})
            this.tab=utils.stringToDom(test).firstChild as HTMLElement;
            this.tab.onclick=()=>setCurrentExplorer(this)
            this.tab.onmouseleave=(e)=>{this.tab.style.background= ""}
            this.tab.onmousemove=(e)=>{
                if (this!==currentExplorer)
                    this.tab.style.background= `radial-gradient(200px at ${e.offsetX}px 50%, rgba(200, 212, 228,1) 0%, rgba(200, 212, 228,0) 100%)`
            }
        }
        this.history.onChangeHistory=(data)=>this.gotoForHistory(data)
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
    gotoForHistory(data: HistoryData)
    {
        this.currentPath=data.path;
        this.update()
    }
    goto(pathFolder: string)
    {
        this.currentPath=pathFolder;
        this.history.pushState(pathFolder);
        this.update()
    }
    previous()
    {
        this.history.back()
    }
    next()
    {
        this.history.forward()
    }
    up()
    {
        let newPath = path.dirname(this.currentPath);
        if (newPath!==this.currentPath)
            this.goto(newPath)
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
    currentExplorer.previous()
}
export function next()
{
    currentExplorer.next()
}
export function up()
{
    currentExplorer.up()
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