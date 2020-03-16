import * as path from 'path'
import * as querystring from 'querystring'
import * as fs from 'fs'
import * as pug from 'pug'
import { remote } from 'electron'
import { extractIcon, openWith, showProperties } from 'internal_module'
import { exec } from "child_process"
import { MyMenuRegister } from "./mymenu"
import * as bc from './breadcrumb'
import * as utils from './utils'
import {Tab} from './tab'
import { iconManager } from './icons'

const urlFolderPng=utils.getResourceURL("Folder.png")
const urlWaiterPng=utils.getResourceURL("waiter.svg")

const pugExplorer = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "explorer.pug"))
const pugExpItem = pug.compileFile(path.join(utils.renderer_path.views, "explorers", "list", "item.pug"))
const pugExpContainer = pug.compileFile(path.join(utils.renderer_path.views, "containers", "explorer-container.pug"))

export class FileInfo
{
    icon: string;
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

export class Explorer extends MyMenuRegister
{
    private explorer: HTMLElement;
    private tab: Tab;
    private currentPath: string;
    private history:ExplorerHistory = new ExplorerHistory();
    // private menu:MyMenu;
    private lsFileInfos: Array<FileInfo>;
    private lsFileSelected: Array<FileInfo> =[];
    public static sassExplorer: HTMLElement;
    public static container: HTMLElement;
    
    constructor(expElem?: HTMLElement)
    {
        super()
        if (expElem)
            this.explorer=expElem
        else
            this.explorer=utils.pugDom('.explorer.explorer-list(data-type="list")') as HTMLElement;
        this.tab = new Tab(this)
        this.history.onChangeHistory=(data)=>this.gotoForHistory(data)
        this.registerMenuProvider({
            type: ["dir"],
            menu: [{
                title: "Ouvrir",
                onclick: (fileInfos: FileInfo[]) => { gotoFolder(fileInfos[0].path) }
            },
            {
                title: "Ouvrir dans un nouvel onglet",
                onclick: (fileInfos: FileInfo[]) => { addExplorer(fileInfos[0].path, true) }
            },
            {
                title: "Ouvrir dans une nouvelle fenêtre",
                onclick: (fileInfos: FileInfo[]) => { addWindow(fileInfos[0].path) }
            },
            {
                title: "Ouvrir dans l'explorateur Windows",
                onclick: (fileInfos: FileInfo[]) => { exec(`explorer.exe "${fileInfos[0].path}"`) }
            }]
        })
        this.registerMenuProvider({menu:[{title:"Plusieurs dossiers"}], type:["dirs"]})
        this.registerMenuProvider({
            type: ["file"], 
            menu: [
                {
                    title: "Ouvrir",
                    onclick: (fileInfos: FileInfo[]) => { exec(`start "" "${fileInfos[0].path}"`) }
                },
                {
                    title: "Ouvrir avec...",
                    onclick: (fileInfos: FileInfo[]) => { openWith(fileInfos[0].path) }
                }
            ]
        })
        this.registerMenuProvider({menu:[{title:"Plusieurs fichiers"}], type:["files"]})
        this.registerMenuProvider({menu:[{title:"Plusieurs items"}], type:["several"]})
        this.registerMenuProvider({menu:[{title:"Rien"}], type:["nothing"]})
        this.registerMenuProvider({
            type: ["dir", "file"],
            menu: [{
                title: "Propriétés",
                onclick: (fileInfos: FileInfo[]) => { showProperties(fileInfos[0].path) }
            }]
        })
        this.explorer.onauxclick=e=>{
            if (e.button==2)
            {
                this.selectItem("reset")
                this.popupMenu([])
            }
        }
        this.explorer.onclick=e=>{
            this.selectItem("reset")
        }
    }
    static setContainer()
    {
        let elContainer = document.querySelector("#container")
        let fchild = document.querySelector("#container").firstChild;
        if (!fchild)
        {
            elContainer.appendChild(Explorer.container)
        }
        else if(fchild != Explorer.container)
        {
            fchild.replaceWith(Explorer.container)
        }
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
        pathFolder = path.resolve(pathFolder)
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
                currentFile.path = path.resolve(`${this.currentPath}/${value}`)
                currentFile.name = value;
                try {
                    currentFile.stat = fs.lstatSync(currentFile.path)
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
    private selectItem(type: "normal"|"add"|"reset",item?:{element: HTMLElement, fileinfo: FileInfo})
    {
        switch (type)
        {
            case "add":
                let t = this.lsFileSelected.findIndex(value=>value===item.fileinfo)
                if (t>0)
                    this.lsFileSelected.splice(t, 1)
                else
                    this.lsFileSelected.push(item.fileinfo)
                item.element.classList.toggle("selected")
                break;
            case "normal":
                document.querySelectorAll(".explorer-item.selected").forEach((elem)=>{
                    elem.classList.remove("selected")
                })
                item.element.classList.add("selected")
                this.lsFileSelected = [item.fileinfo]
                break;
            case "reset":
                document.querySelectorAll(".explorer-item.selected").forEach((elem)=>{
                    elem.classList.remove("selected")
                })
                break;
        }
    }
    protected updateExplorerElements()
    {
        let startFile=(path)=>{
            exec(`start "" "${path}"`)
        }
        this.lsFileInfos.forEach((currentFile)=>{
            let urlIcon = iconManager.getIconSync(currentFile, 24);
            currentFile.icon = urlIcon;
        })
        utils.clearElement(this.explorer);
        let nodeExplorer = utils.stringToDom(pugExplorer());
        let elLsItems = (<HTMLElement>nodeExplorer).querySelector("#list-items")
        let currentExp = this;
        this.lsFileInfos.forEach(currentFile=>{
            let elem = utils.stringToDom(pugExpItem({fileinfo: currentFile})) as HTMLElement;
            let elemFile = elem.childNodes[0] as HTMLElement;
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
                this.selectItem(e.ctrlKey ? "add" : "normal", { element: elemFile, fileinfo: currentFile })
                e.stopPropagation()
            }
            
            elemFile.onauxclick =(e)=>{ 
                if (e.button==2)
                {
                    if (!this.lsFileSelected.includes(currentFile))
                        this.selectItem(e.ctrlKey ? "add" : "normal", { element: elemFile, fileinfo: currentFile })
                    this.popupMenu(this.lsFileSelected)
                    e.stopPropagation()
                }
            }
            elLsItems.parentNode.appendChild(elemFile)
        })
        elLsItems.parentElement.removeChild(elLsItems)
        this.explorer.append(nodeExplorer)
    }
}

Explorer.container = utils.stringToDom(pugExpContainer()).firstChild as HTMLElement
Explorer.sassExplorer = Explorer.container.querySelector("#sass-explorer")
bc.setAddressBar(Explorer.container.querySelector("#address-bar"))

let explorers: Array<Explorer> = new Array<Explorer>();
let currentExplorer:Explorer;

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
    Explorer.setContainer()
    if (Explorer.sassExplorer.hasChildNodes())
        Explorer.sassExplorer.removeChild(currentExplorer.getExplorerElement())
    if (currentExplorer)
        currentExplorer.getTab().unselect()
    if (typeof exp === "number")
        currentExplorer = explorers[exp]
    else
        currentExplorer = exp;
    currentExplorer.getTab().select()
    bc.update(currentExplorer.getPath());
    Explorer.sassExplorer.appendChild(currentExplorer.getExplorerElement())
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
        frame: false,
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
let navElem=Explorer.container.querySelector("#nav");

["previous", "next", "up"].forEach(element => {
    let urlimg = utils.getResourceURL(`nav/${element}.png`)
    let nodeNavBut = utils.pugDom(`img(src="${urlimg}")`) as HTMLElement
    nodeNavBut.onclick=exports[element]
    navElem.appendChild(nodeNavBut)
});



setCurrentExplorer(0)