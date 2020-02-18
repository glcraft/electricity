import { app, BrowserWindow } from 'electron';
import {ApplicationPath} from "./ApplicationPath";
import * as path from 'path';
import * as nodeAbi from 'node-abi'

console.log (`node ABI: ${nodeAbi.getAbi('12.14.0', 'node')}`)
console.log (`electron ABI: ${nodeAbi.getAbi('7.1.11', 'electron')}`)

let mainWindow: BrowserWindow;
let appPaths: ApplicationPath;

function initVars()
{
    appPaths = new ApplicationPath(__dirname);
    mainWindow = new BrowserWindow({ 
        width: 1920/4*3, 
        height: 1080/4*3,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })
}
app.on('ready', async () => {
    initVars();
    let pathToIndex = path.join(appPaths.views,`index.html`);
    let paths = [
        process.cwd(),
        process.env.SystemDrive+path.sep,
        process.env.HOMEDRIVE+process.env.HOMEPATH
    ];
    
    mainWindow.loadFile(pathToIndex, {query:{data: JSON.stringify({paths: paths})} })
})
