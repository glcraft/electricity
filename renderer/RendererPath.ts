import * as path from "path";
export class RendererPath
{
    readonly root: string; 
    readonly app: string; 
    readonly views: string; 
    readonly res: string; 
    constructor(current: string) {
        this.root = path.resolve(current, '..')
        this.app = path.join(this.root , `app-dist`);
        this.views = path.join(this.root , `views`);
        this.res = path.join(this.root , `res`);
    }
}