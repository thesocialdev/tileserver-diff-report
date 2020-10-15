const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const domino = require('domino');

const outputDir = path.join(__dirname, '../output/');

module.exports = class Report {
    constructor(benchmarkResult) {
        this.results = benchmarkResult;
        this.doc = domino.createDocument();
        this.doc.documentElement.innerHTML = fs.readFileSync(path.join(__dirname, '../index.template.html'));
    }

    saveImageToFileSystem(img, imgPath) {
        const filepath = imgPath;
        const targetdir = path.dirname(filepath);
        mkdirp(targetdir).then(() => {
            fs.writeFileSync(filepath, img);
        }).catch((err) => {
            if (err) throw err;
        });
    }

    reportDiffEntry(images) {
        const table = this.doc.querySelector("#diff");
        const tr = this.doc.createElement('tr');
        images.forEach((img) => {
            const imgPath = path.join(outputDir, `./tiles/${img.path}`) + '.png';
            this.saveImageToFileSystem(img.blob, imgPath);
            const imgNode = this.doc.createElement('img');
            imgNode.src = `./tiles/${img.path}` + '.png';
            const td = this.doc.createElement('td');
            td.appendChild(imgNode);
            tr.appendChild(td);
        });
        table.appendChild(tr);
    }

    addReportHeader(benchmarkResult) {
        const { totalPixels, totalDiffPixels, sampleSize } = benchmarkResult;
        console.log("Sample size analyzed:", sampleSize)
        console.log("Percentage of diff pixels:", (totalDiffPixels / totalPixels) * 100)
        // TODO: add summary stats to the header of the html report
    }

    saveFinalReport(benchmarkResult) {
        this.addReportHeader(benchmarkResult);
        const html = '<!DOCTYPE HTML>' + '\n' + this.doc.documentElement.outerHTML;
        mkdirp(outputDir).then(() => {
            fs.writeFileSync(path.join(outputDir, 'index.html'), html, (err) => {
                if (err) throw err;
            });
            console.log("Report saved")
        }).catch((err) => {
            if (err) throw err;
        });
        
    }
}