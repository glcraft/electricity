import * as path from 'path'
import * as fs from 'fs'
import * as pug from 'pug'
import {remote} from 'electron'
import {extractIcon,openWith, showProperties} from 'internal_module'
import {exec} from "child_process"
import {MyMenu} from "./mymenu"
import * as bc from './breadcrumb'
import * as utils from './utils'

// = document.getElementsByClassName("explorer")
const tabs = document.getElementsByClassName("tab")
// let currentExplorer = explorers[0]
let currentTabs = tabs[0]

const urlFolderPng=utils.getResourceURL("Folder.png")
const urlFilePng=utils.getResourceURL("File.png")

const pugExplorerItem = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "item.pug"))
const pugTabItem = pug.compileFile(path.join(utils.renderer_path.views, "tabs", "item.pug"))
class FileInfo
{
    path: string;
    type: "file"|"dir"|"unknown";
    name: string;
}
class FileInfoPug
{
    file: FileInfo
    img: string;
}
class HistoryData
{
    path: string
    scroll: number
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
    pushState(data: HistoryData): void
    {
        ++this.currentpos
        this.hist.length=this.currentpos
        this.hist.push(data)
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
    private menu:MyMenu;
    private lsFileInfos: Array<FileInfo>;
    
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
        // this.menu=new MyMenu([{title: "test", enabled:()=>false, onclick:()=>{
        //     console.log("bisous")
        // }}])
        
        // this.explorer.onauxclick=()=>{
        //     this.menu.popup({ window: remote.getCurrentWindow() });
        // }
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
        if (fs.existsSync(pathFolder) && this.currentPath!=pathFolder)
        {
            this.currentPath=pathFolder;
            this.history.pushState({path:pathFolder, scroll: 0});
            this.update()
            return true;
        }
        return false;
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
    update()
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
            this.lsFileInfos = new Array<FileInfo>();
            for (let iFile = 0;iFile<files.length;++iFile)
            {
                let value = files[iFile];
                let currentFile:FileInfo = new FileInfo();
                currentFile.path = `${this.currentPath}/${value}`
                currentFile.name = value;
                try {
                    let stats = fs.lstatSync(currentFile.path)
                    if (err)
                    {
                        // currentFile.img = urlFilePng
                        currentFile.type="unknown"
                    }
                    else if (stats.isDirectory())
                    {
                        // currentFile.img=urlFolderPng
                        currentFile.type="dir"
                    }
                    else
                    {
                        // let b64Icon = extractIcon(currentFile.path)
                        // currentFile.img=`data:image/png;base64,${b64Icon}`;
                        currentFile.type="file"
                    }
                }
                catch (err)
                {
                    // currentFile.img = urlFilePng
                    currentFile.type="unknown"
                }
                this.lsFileInfos.push(currentFile)
            }
            utils.stable_partition(this.lsFileInfos, v=>v.type=="dir")
            utils.clearElement(this.explorer);
            this.updateExplorerElements();
        });
    }
    protected updateExplorerElements()
    {
        let startFile=(path)=>{
            exec(`start "" "${path}"`)
        }
        let makeFolderConfig=(fileinfo:FileInfo)=>{
            return [
                {
                    title: "Folder", 
                    enabled:false
                },
                {
                    title: "Ouvrir", 
                    onclick:()=>{ gotoFolder(fileinfo.path) }
                },
                {
                    title: "Propriétés", 
                    onclick:()=>{ showProperties(path.resolve(fileinfo.path)) }
                }
            ];
        }
        let makeFileConfig=(fileinfo:FileInfo)=>{
            return [
                {
                    title: "Fichier",
                    enabled:false
                },
                {
                    title: "Ouvrir", 
                    onclick:()=>{ exec(`start "" "${fileinfo.path}"`) }
                },
                {
                    title: "Ouvrir avec...", 
                    onclick:()=>{ openWith(path.resolve(fileinfo.path)) }
                },
                {
                    title: "Propriétés", 
                    onclick:()=>{ showProperties(path.resolve(fileinfo.path)) }
                }
            ];
        }
        this.lsFileInfos.forEach((currentFile)=>{
            let img:string;
            if (currentFile.type=="dir")
                img = urlFolderPng;
            else if (currentFile.type=="file")
            {
                let b64Icon = extractIcon(currentFile.path)
                img =`data:image/png;base64,${b64Icon}`;
            }
            else 
                img = urlFilePng;
            
            let nodeFile = utils.stringToDom(pugExplorerItem({file:currentFile, img: img}));
            if (currentFile.type=="dir")
            {
                (nodeFile.childNodes[0] as HTMLElement).ondblclick = ()=>{
                    gotoFolder(currentFile.path)
                }
                (nodeFile.childNodes[0] as HTMLElement).onauxclick =(e)=>{ 
                    if (e.button==2)
                        new MyMenu(makeFolderConfig(currentFile)).popup() 
                }
            }
            if (currentFile.type=="file")
            {
                (nodeFile.childNodes[0] as HTMLElement).ondblclick = ()=>{ startFile(currentFile.path) };
                (nodeFile.childNodes[0] as HTMLElement).onauxclick = (e)=>{ 
                    if (e.button==2)
                        new MyMenu(makeFileConfig(currentFile)).popup()
                }
            }
            this.explorer.append(nodeFile)
        })
    }
}

let explorers: Array<Explorer> = new Array<Explorer>();
let currentExplorer:Explorer;
let sassExplorer = document.getElementById("sass-explorer")

export function getPath(): string
{
    return currentExplorer.getPath();
}
export function gotoFolder(currentPath: string)
{
    return currentExplorer.goto(currentPath)
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