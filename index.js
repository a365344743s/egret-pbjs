const fs = require("fs");
const path = require("path");
const pbjs = require('protobufjs/cli/pbjs');
const pbts = require('protobufjs/cli/pbts');
const uglifyJS = require('uglify-js');

function generate() {
    const inputRoot = "./in";
    const fileList = fs.readdirSync(inputRoot);
    let protoList = fileList.filter(item => path.extname(item) === '.proto')
    if (protoList.length == 0) {
        throw inputRoot + ' 文件夹中不存在 .proto 文件';
    }
    const args = ['-t', 'static', '-r', 'pbjs'];
    for (let i = 0, len = protoList.length;i < len;i++){
        args.push("./in/" + protoList[i]);
    }
    let outTempPath = "./out/tmp.js";
    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }
    pbjs.main(args, function(err, output) {
        if (err)
            throw err;
        fs.writeFileSync(outTempPath, output);
        //*.js
        output = 'var $protobuf = protobuf;\n$protobuf.roots = $protobuf.util.global;\n' + output;
        let outJsPath = "./out/pbjs.js";
        fs.writeFileSync(outJsPath, output);
        //*.min.js
        const minjs = uglifyJS.minify(output);
        let outJsMinPath = "./out/pbjs.min.js";
        fs.writeFileSync(outJsMinPath, minjs.code, 'utf-8');
        //*.d.ts
        let outTsPath = "./out/pbjs.d.ts";
        pbts.main([outTempPath], function(err, output) {
            if (err)
                throw err;
            output = output.replace('import * as $protobuf from "protobufjs";', 'import * as $protobuf from "../protobuf/protobuf";\nexport as namespace pbjs;\n');
            output = output.replace('number|Long', 'Long');
            output = output.replace('(Long)', 'Long');
            fs.writeFileSync(outTsPath, output);
            fs.unlinkSync(outTempPath);
        });
    });
}

generate();