import * as utils from './utils'
import * as path from 'path'
import * as pug from 'pug'

const pugBCItem = pug.compileFile(path.join(utils.renderer_path.views, "breadcrumb", "item.pug"))

export function update(currentPath: string)
{
    let nodeBC = document.getElementById("breadcrumb-explorer")
    while (nodeBC.firstChild) {
        nodeBC.removeChild(nodeBC.firstChild);
    }
    const parsedPath = path.parse(currentPath)
    let BCFields: string[]=parsedPath.dir.split(/[\\/]/g);
    BCFields.push(parsedPath.base)
    let createBCItem = field=>{
        let htmlBCItem = pugBCItem({name: field, sepfile: utils.getResourceURL("breadcrumb_sep.png")})
        nodeBC.append(utils.stringToDom(htmlBCItem))
    }
    BCFields.forEach(createBCItem)
}