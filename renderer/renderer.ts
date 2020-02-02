import * as fs from 'fs'
import * as path from 'path'
import * as uuid from 'uuid/v4'
import * as iconExtractor  from 'icon-extractor'
import * as bindings from '../extract-icon/node_modules/bindings'
import {RendererPath} from './RendererPath'

let expl = document.getElementsByClassName("explorer")
let geticon=bindings("extract-icon")
const rendererPath = new RendererPath(__dirname)

const currentPath = "D:/Projects/electricity/extract-icon"

let urlFolderPng=path.join(rendererPath.res, "Folder.png")
                        
urlFolderPng=`file:///${urlFolderPng}`
urlFolderPng=urlFolderPng.replace(/\\/g, "/");

fs.readdir(currentPath,(err, files)=>{
    if (err)
        console.error("ya eu un probleme ", err)
    else
    {
        let i=0;
        files.forEach((value) => {
            var elem = document.createElement("div");
            var pathItem = `${currentPath}/${value}`
            elem.classList.add("explorer-list-item");//{path: value, parent: elem}
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
                        let b64Icon = geticon.geticon(`D:/Projects/electricity/${value}`)
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
