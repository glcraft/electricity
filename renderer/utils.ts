import * as path from 'path'
import * as pug from 'pug'
import {RendererPath} from './RendererPath'

export const renderer_path = new RendererPath(__dirname)

export function getResourceURL(filename: string)
{
    return `file:///${path.join(renderer_path.res, filename)}`.replace(/\\/g, "/")
}
export function stringToDom(html:string) : Node
{
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.cloneNode(true);
}
export function stable_partition<T>(array: Array<T>, validate: (t1:T)=>boolean): number//, swap?:(t1:T, t2:T)=>void)
{
    let i2=0
    for(let i1=0;i1<array.length;i1++)
    {
        let v=array[i1];
        if (validate(v))
        {
            // if (swap)
            //     swap(array[i1], array[i2])
            // else
            {
                ///Partition stable
                array.splice(i2, 0, array[i1])
                array.splice(i1+1, 1)
            }
            i2++
        }
    }
    return i2;
}
export function clearElement(exp: Element)
{
    while (exp.firstChild) {
        exp.removeChild(exp.firstChild);
    }
}
export function getFolderName(p:string) {
    let t = /^(\w):[\\/]?$/.exec(p);
    if (t)
        return `Disque ${t[1]}`
    else 
    {
        return path.basename(p);
    }
}
export function pugDom(pugString:string) : Node
{
    return stringToDom(pug.render(pugString)).firstChild;
}
export function resolvePathEnvVar(pathToResolve:string)
{
    let lsFound: RegExpExecArray;
    while(lsFound=/\$(\w+)/.exec(pathToResolve))
    {
        let found=searchObjectCaseIns(process.env,lsFound[1]);
        if (found===undefined)
            found=""
        pathToResolve = pathToResolve.substring(0,lsFound.index)+found+pathToResolve.substr(lsFound.index+lsFound[0].length)
    }
    return pathToResolve;
}

export function searchObjectCaseIns(obj:Object, toSearch:string):any
{
    toSearch = toSearch.toLowerCase();
    for(let p in obj){
        if(obj.hasOwnProperty(p) && toSearch == p.toLowerCase()){
            return obj[p];
            break;
        }
    }
}

export function download(url:string, method: "GET"|"POST"): Promise<string> {
    return new Promise<string>((resolve, reject)=>{
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) 
                resolve(xhr.responseText);
            else
                reject(xhr)
        };
        xhr.open(method, url, true);
    })
  }