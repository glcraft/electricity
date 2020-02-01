import * as path from "path";

export class ApplicationPath
{
    readonly root: string; 
    readonly app: string; 
    readonly views: string; 
    constructor(current: string) {
        this.root = path.resolve(__dirname, '..')
        this.app = path.join(this.root , `app-dist`);
        this.views = path.join(this.root , `views`);
    }
}