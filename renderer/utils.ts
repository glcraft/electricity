import * as path from 'path'
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
    let t = /(\w):[\\/]?/.exec(p);
    if (t)
        return `Disque ${t[1]}`
    else 
    {
        path.basename(p);
    }
}