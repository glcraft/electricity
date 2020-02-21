import * as path from 'path'
import * as querystring from 'querystring'
import * as fs from 'fs'
import * as pug from 'pug'
import { remote } from 'electron'
import { extractIcon, openWith, showProperties } from 'internal_module'
import { exec } from "child_process"
import { MyMenu } from "./mymenu"
import * as bc from './breadcrumb'
import * as utils from './utils'
import {Tab} from './tab'
import { iconManager } from './icons'

const urlFolderPng=utils.getResourceURL("Folder.png")
const urlFilePng=utils.getResourceURL("File.png")

const pugExplorerItem = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "item.pug"))

export class FileInfo
{
    path: string;
    type: "file"|"dir"|"unknown";
    name: string;
    stat: fs.Stats;
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

export class Explorer
{
    private explorer: HTMLElement;
    private tab: Tab;
    private currentPath: string;
    private history:ExplorerHistory = new ExplorerHistory();
    private menu:MyMenu;
    private lsFileInfos: Array<FileInfo>;
    private lsFileSelected: Array<FileInfo>;
    
    constructor(expElem?: HTMLElement)
    {
        if (expElem)
            this.explorer=expElem
        else
            this.explorer=utils.pugDom('.explorer.explorer-list(data-type="list")') as HTMLElement;
        this.tab = new Tab(this)
        this.history.onChangeHistory=(data)=>this.gotoForHistory(data)
    }
    setTabName(newName: string)
    {
        this.tab.setName(newName)
    }
    getPath(): string 
    {
        return this.currentPath;
    }
    getExplorerElement():HTMLElement
    {
        return this.explorer;
    }
    getTab():Tab
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
    close(keepTab?:boolean)
    {
        let id = explorers.findIndex(e=>e===this)
        explorers.splice(id, 1)
        if (keepTab)
            this.tab.close(true)
        if (explorers.length==0)
            remote.getCurrentWindow().close()
        if (this===currentExplorer)
        {
            if (id===0)
                setCurrentExplorer(0)
            else
            setCurrentExplorer(id-1)
        }
    }
    update()
    {
        let t: Array<number>;
        this.currentPath = path.resolve(this.currentPath)
        
        bc.update(this.currentPath);
        this.setTabName(utils.getFolderName(this.currentPath))
        fs.readdir(this.currentPath,(err, files)=>{
            if (err)
            {
                console.error(`Erreur lecture du dossier ${this.currentPath}`, err);
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
                    currentFile.stat = fs.lstatSync(currentFile.path, {bigint: true})
                    if (currentFile.stat.isDirectory())
                        currentFile.type="dir"
                    else
                        currentFile.type="file"
                }
                catch (err)
                {
                    currentFile.type="unknown"
                }
                this.lsFileInfos.push(currentFile)
            }
            utils.stable_partition(this.lsFileInfos, v=>v.type=="dir")
            
            this.updateExplorerElements();
        });
    }
    static createMenuItem(fileinfo:FileInfo)
    {
        let makeFolderConfig=(fileinfo:FileInfo)=>{
            return [
                {
                    title: "Dossier", 
                    enabled:false
                },
                {},
                {
                    title: "Ouvrir", 
                    onclick:()=>{ gotoFolder(fileinfo.path) }
                },
                {
                    title: "Ouvrir dans un nouvel onglet", 
                    onclick:()=>{ addExplorer(fileinfo.path, true) }
                },
                {
                    title: "Ouvrir dans une nouvelle fenêtre", 
                    onclick:()=>{ addWindow(fileinfo.path) }
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
                {},
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
        if (fileinfo.type=="dir")
            return makeFolderConfig(fileinfo);
        else if (fileinfo.type=="file")
            return makeFileConfig(fileinfo);
    }
    protected updateExplorerElements()
    {
        let startFile=(path)=>{
            exec(`start "" "${path}"`)
        }
        utils.clearElement(this.explorer);
        this.lsFileInfos.forEach((currentFile)=>{
            let nodeFile = utils.stringToDom(pugExplorerItem({file:currentFile, img: urlFilePng}));
            let elemFile = (nodeFile.childNodes[0] as HTMLElement)
            iconManager.getIcon(currentFile, 24).then(urlIcon=>{
                let newImg = document.createElement("img");
                let img = (elemFile as HTMLElement).querySelector('img')
                newImg.onload=()=>{
                    img.parentElement.replaceChild(newImg,img)
                }
                newImg.src = urlIcon
            });
            elemFile.ondblclick = ()=>{
                switch (currentFile.type) {
                    case "dir":
                        gotoFolder(currentFile.path)
                        break;
                    case "file":
                        startFile(currentFile.path)
                        break;
                    default:
                        remote.dialog.showMessageBoxSync({ 
                            type: "error", 
                            message: "Ce type de fichier n'est pas reconnu.", 
                            title: "Type de fichier inconnu" 
                        });
                        break;
                }
            };
            elemFile.onclick = (e) => {
                if (e.ctrlKey==true)
                {
                    let t = this.lsFileSelected.findIndex(value=>value===currentFile)
                    if (t>0)
                        this.lsFileSelected.splice(t, 1)
                    else
                        this.lsFileSelected.push(currentFile)
                    elemFile.classList.toggle("selected")
                }
                else 
                {
                    document.querySelectorAll(".explorer-item.selected").forEach((elem)=>{
                        elem.classList.remove("selected")
                    })
                    elemFile.classList.add("selected")
                    this.lsFileSelected = [currentFile]
                }
                
            }
            elemFile.onauxclick =(e)=>{ 
                if (e.button==2)
                    new MyMenu(Explorer.createMenuItem(currentFile)).popup() 
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
        currentExplorer.getTab().unselect()
    if (typeof exp === "number")
        currentExplorer = explorers[exp]
    else
        currentExplorer = exp;
        currentExplorer.getTab().select()
    sassExplorer.appendChild(currentExplorer.getExplorerElement())
    currentExplorer.update()
}
export function getCurrentExplorer(): Explorer
{
    return currentExplorer;
}
export function addWindow(paths: string | string[])
{
    let currentBound = remote.getCurrentWindow().getBounds();
    let newWindow = new remote.BrowserWindow({ 
        width: currentBound.width, 
        height: currentBound.height, 
        x: currentBound.x+32, 
        y: currentBound.y+32, 
        show: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    let pathToIndex = path.join(utils.renderer_path.views, "index.html")
    if (typeof paths === "string")
        paths = [ paths ]
    newWindow.loadFile(pathToIndex, {query:{data: JSON.stringify({paths: paths})} })
}
export function addExplorer(path: string, beCurrent=false) : Explorer
{
    let exp = new Explorer()
    exp.goto(path)
    explorers.push(exp)
    if (beCurrent)
        setCurrentExplorer(exp);
    return exp
}
export function removeExplorer(exp: Explorer|number)
{
    currentExplorer.close();
}
//INITIAL
let query = querystring.parse((global as any).location.search)
let data = JSON.parse(query['?data'] as string)
if (data.paths)
    data.paths.forEach((p)=>addExplorer(p))
let navElem=document.getElementById("nav");

["previous", "next", "up"].forEach(element => {
    let urlimg = utils.getResourceURL(`nav/${element}.png`)
    let nodeNavBut = utils.pugDom(`img(src="${urlimg}")`) as HTMLElement
    nodeNavBut.onclick=exports[element]
    navElem.appendChild(nodeNavBut)
});
setCurrentExplorer(0)