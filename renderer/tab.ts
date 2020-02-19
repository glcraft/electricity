import{Explorer,addExplorer,addWindow,setCurrentExplorer,getCurrentExplorer} from "./explorer"
import * as path from 'path'
import {MyMenu} from './mymenu'
import * as pug from 'pug'
import * as utils from './utils'



export class Tab
{
    private elTab: HTMLElement;
    private explorer: Explorer;

    private closed: boolean;

    static readonly elBar=document.getElementById("tab-bar");
    readonly pugTabItem = pug.compileFile(path.join(utils.renderer_path.views, "tabs", "item.pug"));
    readonly urlClosePng=utils.getResourceURL("Close.png");

    constructor(exp: Explorer)
    {
        this.explorer=exp
        this.closed=false;

        this.init()
    }
    init()
    {
        let test=this.pugTabItem({name:"", imgClose: this.urlClosePng})
        this.elTab = utils.stringToDom(test).firstChild as HTMLElement;
        let tabClose = this.elTab.querySelector("img")
        let closing=false;
        tabClose.onclick=(e)=>{ 
            this.close(); 
        }
        this.elTab.onclick=(e)=>{
            if (!this.closed) 
                setCurrentExplorer(this.explorer)
        }
        this.elTab.onauxclick=(e)=>{
            if (e.button==1)
                this.close();
            if (e.button==2)
            {
                new MyMenu([
                    {
                        title: "Fermer",
                        onclick:()=>{ this.close(); }
                    },
                    {
                        title: "Dupliquer", 
                        onclick:()=>{ this.duplicate(); }
                    },
                    {
                        title: "Ouvrir dans une nouvelle fenêtre", 
                        onclick:()=>{ this.newWindow(); }
                    }
                ]).popup();
            }
        }
        
        this.elTab.onmouseleave=(e)=>{
            this.elTab.style.background= ""
        }
        this.elTab.onmousemove=(e)=>{
            if (this.explorer!==getCurrentExplorer())
                this.elTab.style.background= `radial-gradient(200px at ${e.pageX - this.elTab.offsetLeft}px 50%, var(--col-hovered) 0%, rgba(0,0,0,0) 100%)`
            else
                this.elTab.style.background= ""
        }
        Tab.elBar.appendChild(this.elTab)
        return this.elTab;
    }
    setName(newName: string)
    {
        this.elTab.querySelector(".tab-name").textContent=newName
    }
    getName(): string
    {
        return this.elTab.querySelector(".tab-name").textContent
    }
    unselect()
    {
        this.elTab.classList.remove("selected")
    }
    select()
    {
        this.elTab.classList.add("selected")
    }
    isSelected()
    {
        this.elTab.classList.contains("selected")
    }

    close(keepExp?: boolean)
    {
        this.closed=true;
        Tab.elBar.removeChild(this.elTab)
        if (keepExp)
            this.explorer.close(true)
    }
    duplicate()
    {
        addExplorer(this.explorer.getPath(), true)
    }
    newWindow()
    {
        addWindow(this.explorer.getPath())
    }
}