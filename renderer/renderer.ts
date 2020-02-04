import * as fs from 'fs'
import * as path from 'path'
import * as uuid from 'uuid/v4'
import {extractIcon} from 'extract-icon'
import {RendererPath} from './RendererPath'
import * as pug from 'pug'

let expl = document.getElementsByClassName("explorer")
let geticon=extractIcon
const rendererPath = new RendererPath(__dirname)

const firstPath = `${process.cwd()}`

const pugBCItem = pug.compileFile(path.join(rendererPath.views, "breadcrumb", "item.pug"))

function getResource(filename: string)
{
    return `file:///${path.join(rendererPath.res, filename)}`.replace(/\\/g, "/")
}
function stringToDom(html:string) : Node
{
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.cloneNode(true);
}

const urlFolderPng=getResource("Folder.png")
function updateBreadcrumb(currentPath: string)
{
    let nodeBC = document.getElementById("breadcrumb-explorer")
    while (nodeBC.firstChild) {
        nodeBC.removeChild(nodeBC.firstChild);
    }
    const parsedPath = path.parse(currentPath)
    let BCFields: string[]=parsedPath.dir.split(/[\\/]/g);
    BCFields.push(parsedPath.base)
    let createBCSeparator = ()=>{
        let nodeItem = document.createElement("li")
        nodeItem.classList.add("bc-item", "explorer-hoverable")
        let nodeSep = document.createElement("img")
        nodeSep.setAttribute("src",getResource("breadcrumb_sep.png"))
        nodeSep.classList.add("bc-sep")

        nodeItem.append(nodeSep)
        nodeBC.append(nodeItem)
    }
    let createBCItem = field=>{
        let htmlBCItem = pugBCItem({name: field, sepfile: getResource("breadcrumb_sep.png")})
        nodeBC.append(stringToDom(htmlBCItem))
    }
    BCFields.forEach(createBCItem)
}
function gotoFolder(currentPath: string)
{
    currentPath = path.resolve(currentPath)
    fs.readdir(currentPath,(err, files)=>{
        if (err)
            console.error("ya eu un probleme ", err)
        else
        {
            let i=0;
            files.forEach((value) => {
                var elem = document.createElement("div");
                var pathItem = `${currentPath}/${value}`
                elem.classList.add("explorer-item", "explorer-list-item", "explorer-hoverable");//{path: value, parent: elem}
                elem.id = uuid()
                
                let img = document.createElement("img")
                img.setAttribute("src",``)
                elem.append(img)
                let divName = document.createElement("div")
                divName.textContent=value
                elem.append(divName)
                expl[0].append(elem)
                fs.lstat(pathItem, async (err, stats)=>{
                    if (!err)
                    {
                        let srcimg: string;
                        if (stats.isDirectory())
                        {
                            srcimg=urlFolderPng
                            elem.dataset.type="dir"
                        }
                        else 
                        {
                            let b64Icon = geticon.geticon(`${currentPath}/${value}`)
                            srcimg=`data:image/png;base64,${b64Icon}`;
                            elem.dataset.type="file"
                        }
                        img.setAttribute("src",srcimg)
                    }
                    else
                        elem.dataset.type="unknown"
                    i++
                    if (i==(files.length))
                    {
                        let b = expl[0].children
                        let i2=0
                        for(let i1=0;i1<b.length;i1++)
                        {
                            let v=b[i1] as HTMLElement;
                            if (v.dataset.type=="dir")
                            {
                                expl[0].insertBefore(b[i1], b[i2]);
                                i2++
                            }
                        }
                    }
                    
                })
            })
            
        }
    })
    updateBreadcrumb(currentPath);
}
gotoFolder(firstPath)