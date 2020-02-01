import { app, BrowserWindow } from 'electron';
import {ApplicationPath} from "./ApplicationPath";
import * as path from 'path';

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