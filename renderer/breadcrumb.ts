import * as path from 'path'
import * as fs from 'fs'
import * as pug from 'pug'
import * as utils from './utils'
import * as explorer from './explorer'
import { iconManager } from './icons'

const pugBCItem = pug.compileFile(path.join(utils.renderer_path.views, "breadcrumb", "item.pug"))
const pugBCLSItem = pug.compileFile(path.join(utils.renderer_path.views, "breadcrumb", "lsitem.pug"))
let nodeAdressBar: HTMLElement;
const urlFolderPng=utils.getResourceURL("Folder.png")
export function setAddressBar(elAddr: HTMLElement)
{
    nodeAdressBar = elAddr;
}

export function update(currentPath: string)
{
    let nodeBC = nodeAdressBar.querySelector("#breadcrumb-explorer")
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
        let DomBCItem = nodeBCItem.childNodes[0] as HTMLElement;
        let pathCurrentButton = pathButton;
        DomBCItem.onclick = ()=>{
            explorer.gotoFolder(pathCurrentButton)
        }
        let domBCSep = (<HTMLElement>nodeBCItem).querySelector<HTMLElement>(".bc-sep");
        let domBCLSF = (<HTMLElement>nodeBCItem).querySelector<HTMLElement>(".bc-ls-folder");
        let domBCLSFAll = document.querySelectorAll<HTMLElement>(".bc-ls-folder");
        domBCSep.onclick = ()=>{
            if (domBCLSF.style.display=="none")
            {
                domBCLSFAll.forEach(el=>el.style.display="none")
                domBCLSF.style.display="block";
                utils.clearElement(domBCLSF)
                fs.readdir(pathCurrentButton,(err, files)=>{
                    for (let iFile = 0;iFile<files.length;++iFile)
                    {
                        let fileinfo: explorer.FileInfo=new explorer.FileInfo;
                        fileinfo.name=files[iFile];
                        fileinfo.path=`${pathCurrentButton}/${fileinfo.name}`;
                        try {
                            fileinfo.stat = fs.lstatSync(fileinfo.path)
                            if (fileinfo.stat.isDirectory())
                            {
                                fileinfo.type="dir"
                                let elem = utils.stringToDom(pugBCLSItem({urlFolder: iconManager.getIcon(fileinfo, 24), folderName: fileinfo.name}));
                                domBCLSF.appendChild(elem)
                            }
                        }
                        catch (err)
                        {}
                    }
                })
            }
            else
                domBCLSF.style.display="none";
        }
        domBCLSF.onclick = (e)=>{
            explorer.gotoFolder(`${pathCurrentButton}/${(<HTMLElement>e.target).textContent}`)
            
            domBCLSF.style.display="none";
        }
        nodeBC.append(nodeBCItem)
    }
    BCFields.forEach(createBCItem)
    let addressTap=nodeAdressBar.querySelector("#address-tap")
    addressTap.onclick=()=>{
        utils.clearElement(nodeBC)
        let inputElem=document.createElement("input")
        inputElem.setAttribute("id", "address")
        inputElem.value = explorer.getPath()
        let undoFocusOut=false
        inputElem.addEventListener("keydown", function(event) {
            if (event.key === "Tab") {
                console.log("tab pressed")
                inputElem.value=utils.resolvePathEnvVar(inputElem.value)
                if (!inputElem.value.endsWith(path.sep) && inputElem.value!=="")
                {
                    let parentPath = path.dirname(inputElem.value)
                    let toFound = path.basename(inputElem.value)
                    fs.readdir(parentPath, (err,paths)=>{
                        if (err)
                            return;
                        let lsFounds = new Array<string>();
                        
                        for(let i=0;i<paths.length;i++)
                            if(RegExp(`^${toFound}`).exec(paths[i]))
                            {
                                if (fs.statSync(path.join(parentPath, paths[i])).isDirectory())
                                    lsFounds.push(paths[i])
                            }
                        if (lsFounds.length==1)
                            inputElem.value=path.join(parentPath, lsFounds[0])+path.sep
                        else if (lsFounds.length>1)
                        {
                            let stop=false;
                            let pos=0;
                            while(!stop)
                            {
                                let currentLetter=""
                                for(let iDir=0;iDir<lsFounds.length;++iDir)
                                {
                                    if (pos>=lsFounds[iDir].length)
                                    { 
                                        stop = true; 
                                        break; 
                                    }
                                    if (currentLetter=="")
                                        currentLetter=lsFounds[iDir][pos]
                                    else if (lsFounds[iDir][pos]!=currentLetter)
                                    {
                                        stop = true; 
                                        break; 
                                    }
                                }
                                ++pos
                            }
                            inputElem.value=path.join(parentPath, lsFounds[0].substr(0,pos-1))
                        }
                    })
                }
                event.preventDefault()
            }
        })
        inputElem.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                undoFocusOut=true
                inputElem.value=utils.resolvePathEnvVar(inputElem.value)
                undoFocusOut=explorer.gotoFolder(inputElem.value)
                if (!undoFocusOut)
                    inputElem.blur()
            }
        });
        inputElem.addEventListener("focusout",()=>{
            if (!undoFocusOut)
                update(explorer.getPath())
        })
        nodeBC.appendChild(inputElem)
        inputElem.focus()
    }
}