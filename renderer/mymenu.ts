import {remote, Menu, MenuItem, PopupOptions, BrowserWindow} from 'electron'

interface MyMenuItem
{
    /**
     * If not defined, is separator
     */
    title?: string;
    onclick: (menuItem?:MenuItem, browserWindow?:BrowserWindow, event?:KeyboardEvent)=>void;
    /**
     * Path to an icon
     */
    icon?: string;

    visible?: boolean | (()=>boolean);
    enabled?: boolean | (()=>boolean);
    submenus?: Array<MyMenuItem>;
}

export class MyMenu
{
    private menu:Menu;
    config: Array<MyMenuItem>;
    constructor(conf:Array<MyMenuItem>)
    {
        this.config=conf;
    }
    popup(options?: PopupOptions)
    {
        let menu = MyMenu.createMenu(this.config)
        menu.popup(options)
    }
    private static createMenu(config: Array<MyMenuItem>): Menu
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
                    submenu:MyMenu.createMenu(item.submenus),
                });
            }
            else
            {
                menuitem = new remote.MenuItem({
                    type:"normal", 
                    label: item.title,
                    click: item.onclick,
                    icon:item.icon,
                    visible:item.visible!==undefined?(typeof item.visible=="boolean"?item.visible:item.visible()):true,
                    enabled:item.enabled!==undefined?(typeof item.enabled=="boolean"?item.enabled:item.enabled()):true
                });
            }
            menu.append(menuitem)
        });
        return menu;
    }
}