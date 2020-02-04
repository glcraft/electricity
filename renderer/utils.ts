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