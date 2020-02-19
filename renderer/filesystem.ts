import * as fs from 'fs'
import {fileOperation} from 'internal_module'

let op: "copy"|"cut"
let toCopy: fs.PathLike|undefined=undefined;
export module myfilesystem
{
    function copy_from(from: fs.PathLike, to: fs.PathLike)
    {
        fileOperation("copy", {from: from.toString(), to: to.toString()});
    }
    function cut_item(filepath: fs.PathLike)
    {
        if (fs.existsSync(filepath))
        {
            op="cut"
            toCopy=filepath
        }
    }
    function copy_item(filepath: fs.PathLike)
    {
        if (fs.existsSync(filepath))
        {
            op="copy"
            toCopy=filepath
        }
    }
    function paste_item(where: fs.PathLike)
    {
        let stat = fs.statSync(where)
        if (stat.isDirectory() && toCopy)
            fileOperation(op, {from: toCopy.toString(), to: where.toString()});
    }
    function delete_item(filepath: fs.PathLike)
    {
        let stat = fs.statSync(filepath)
        if (stat.isDirectory())
            fs.rmdirSync(filepath)
    }
}