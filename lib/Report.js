const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = class Report {
    constructor(benchmarkResult) {
        this.results = benchmarkResult;
    }

    saveImageToFileSystem(img, imgPath) {
        const filepath = path.join(__dirname, `../output/tiles/${imgPath}`) + '.png';
        const targetdir = path.dirname(filepath);
        mkdirp(targetdir).then(() => {
            fs.writeFileSync(filepath, img);
        }).catch((err) => {
            if (err) throw err;
        });
    }

    addReportHeader() {
        // TODO: add summary stats to the header of the html report
    }

    addDiffTableRow() {
        // TODO: add a table row to the html report with 3 images side by side
    }
}