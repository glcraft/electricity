import {FileInfo} from './explorer'
import * as utils from './utils'
import { extractIcon } from 'internal_module'

export interface IconStorage
{
    getIcon(itemInfo: FileInfo, iconsize: number): string|undefined;
}
class DefaultIconStorage implements IconStorage
{
    static readonly urlFolderPng=utils.getResourceURL("Folder.png")
    static readonly urlFilePng=utils.getResourceURL("File.png")
    getIcon(itemInfo: FileInfo, iconsize: number): string|undefined
    {
        let img: string;
        if (itemInfo.type=="dir")
            img = DefaultIconStorage.urlFolderPng;
        else if (itemInfo.type=="file")
        {
            let b64Icon = extractIcon(itemInfo.path)
            img =`data:image/png;base64,${b64Icon}`;
        }
        else 
            img = DefaultIconStorage.urlFilePng;
        
        return img;
    }
}

class IconManager implements IconStorage
{
    private lsStorages: Array<IconStorage> =[];
    constructor()
    {
        this.registerIconStorage(new DefaultIconStorage);
    }
    registerIconStorage(iconstorage: IconStorage)
    {
        this.lsStorages.push(iconstorage);
    }
    removeIconStorage(iconstorage: IconStorage)
    {
        let i = this.lsStorages.indexOf(iconstorage, 0)
        if (i > -1)
            this.lsStorages.splice(i, 1);
    }
    getIcon(itemInfo: FileInfo, iconsize: number): string|undefined
    {
        for(let i=this.lsStorages.length-1;i>=0;--i)
        {
            let ic = this.lsStorages[i].getIcon(itemInfo, iconsize)
            if (ic)
                return ic;
        }
        return "";
    }
}
export let iconManager: IconManager=new IconManager();