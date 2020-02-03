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
        width: 800, 
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
}
app.on('ready', async () => {
    initVars();
    let pathToIndex = path.join(appPaths.views,`index.html`);
    mainWindow.loadFile(pathToIndex)
})