import * as path from 'path'
import * as pug from 'pug'
import * as utils from './utils'
import * as explorer from './explorer'

const pugBCItem = pug.compileFile(path.join(utils.renderer_path.views, "breadcrumb", "item.pug"))

export function update(currentPath: string)
{
    let nodeBC = document.getElementById("breadcrumb-explorer")
    utils.clearElement(nodeBC)
    const parsedPath = path.parse(currentPath)
    let BCFields: string[]=parsedPath.dir.split(/[\\/]/g);
    if (BCFields[BCFields.length-1]=="")
        BCFields.pop()
    if (parsedPath.base!="")
        BCFields.push(parsedPath.base)
    let pathButton="";
    let createBCItem = field=>{
        if (pathButton!=="")
            pathButton = path.join(pathButton, field)
        else
            pathButton = field+path.sep
            
        field = utils.getFolderName(pathButton)
        
        let htmlBCItem = pugBCItem({name: field, sepfile: utils.getResourceURL("breadcrumb_sep.png")})
        let nodeBCItem = utils.stringToDom(htmlBCItem);
        let pathCurrentButton = pathButton;
        ((nodeBCItem as HTMLElement).children[0] as HTMLElement).onclick = ()=>{
            explorer.gotoFolder(pathCurrentButton)
        }
        nodeBC.append(nodeBCItem)
    }
    BCFields.forEach(createBCItem)
}