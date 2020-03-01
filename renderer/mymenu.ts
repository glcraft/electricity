import {remote, Menu, MenuItem, PopupOptions, BrowserWindow} from 'electron'
import {FileInfo} from './explorer'

interface MyMenuItem
{
    /**
     * If not defined, is separator
     */
    title?: string;
    onclick?: (lsFiles: Array<FileInfo>, menuInfo: {menuItem?:MenuItem, browserWindow?:BrowserWindow, event?:KeyboardEvent})=>void;
    /**
     * Path to an icon
     */
    icon?: string;

    visible?: boolean | (()=>boolean);
    enabled?: boolean | (()=>boolean);
    submenus?: Array<MyMenuItem>;
}

function createMenu(lsFiles: Array<FileInfo>, config: Array<MyMenuItem>): Menu
{
    let menu = new remote.Menu();
    config.forEach(item => {
        let menuitem:MenuItem;
        if (!item.title)
            menuitem= new remote.MenuItem({type:"separator"});
        else if (item.submenus)
        {
            menuitem= new remote.MenuItem({
                type:"submenu",
                label:item.title,
                submenu:createMenu(lsFiles, item.submenus),
            });
        }
        else
        {
            menuitem = new remote.MenuItem({
                type:"normal", 
                label: item.title,
                click: (menuItem?: MenuItem, browserWindow?: BrowserWindow, event?: KeyboardEvent) => { item.onclick(lsFiles, { menuItem: menuItem, browserWindow: browserWindow, event: event }) },
                icon:item.icon,
                visible:item.visible!==undefined?(typeof item.visible=="boolean"?item.visible:item.visible()):true,
                enabled:item.enabled!==undefined?(typeof item.enabled=="boolean"?item.enabled:item.enabled()):true
            });
        }
        menu.append(menuitem)
    });
    return menu;
}
function popupMenu(lsFiles: Array<FileInfo>, menus: Array<MyMenuItem>, options?: PopupOptions)
{
    let menu = createMenu(lsFiles, menus)
    menu.popup(options)
}
type FilesType = "nothing"|"dir"|"dirs"|"file"|"files"|"several";
export interface MyMenuProvider
{
    menu:Array<MyMenuItem>;
    type:FilesType[];
}
export class MyMenuRegister
{
    private lsMenus:Array<MyMenuProvider> = new Array<MyMenuProvider>();
    registerMenuProvider(m:MyMenuProvider)
    {
        this.lsMenus.push(m)
    }
    popupMenu(lsFiles: Array<FileInfo>, options?: PopupOptions)
    {
        let menuToDisp: Array<MyMenuItem> = new Array<MyMenuItem>();
        let filestype=this.detectFilesType(lsFiles);
        this.lsMenus.forEach(menuP=>{
            if (menuP.type.includes(filestype))
            {
                menuToDisp=menuToDisp.concat(menuP.menu);
                menuToDisp.push({});
            }
        })
        if (menuToDisp.length>0)
            menuToDisp.splice(menuToDisp.length-1,1);
        popupMenu(lsFiles, menuToDisp, options);
    }
    private detectFilesType(lsFiles: Array<FileInfo>): FilesType|undefined
    {
        let res: FilesType="nothing";
        lsFiles.forEach(file=>{
            if (res=="several")
            { }
            else if (res=="nothing" && file.type!="unknown")
            {
                res = file.type;
            }
            else
            {
                if (res=="dir" || res=="dirs")
                {
                    if (file.type=="dir")
                        res = "dirs"
                    else
                        res="several";
                }
                else if (res=="file" || res=="files")
                {
                    if (file.type=="file")
                        res = "files"
                    else
                        res = "several";
                }
            }
        })
        return res;
    }
}

export function makeCopyPaste(fi:FileInfo): Array<MyMenuItem>
{
    return [
        {
            title: "Copier",
            onclick: ()=>{}
        },
        {
            title: "Copier le chemin",
            onclick: ()=>{}
        },
        {
            title: "Couper",
            onclick: ()=>{}
        },
        {
            title: "Coller",
            onclick: ()=>{}
        }
    ]
}