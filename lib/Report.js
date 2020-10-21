const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const domino = require('domino');

const outputDir = path.join(__dirname, '../output/');

module.exports = class Report {
    constructor() {
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

    reportDiffEntry(images, pathOnly = false) {
        const table = this.doc.querySelector("#diff");
        const tr = this.doc.createElement('tr');
        images.forEach((img) => {
            const imgPath = path.join(outputDir, `./tiles/${img.path}`) + '.png';
            if (!pathOnly) {
                this.saveImageToFileSystem(img.blob, imgPath);   
            }
            const imgNode = this.doc.createElement('img');
            imgNode.src = `./tiles/${img.path}` + '.png';
            const td = this.doc.createElement('td');
            td.appendChild(imgNode);
            tr.appendChild(td);
        });
        table.appendChild(tr);
    }

    createReportFromCachedFile() {
        function moduleIsAvailable (path) {
            try {
                require.resolve(path);
                return true;
            } catch (e) {
                return false;
            }
        }
        const cachedResults = moduleIsAvailable('../output/results.json') ? require('../output/results.json') : {};
        const diffFiles = fs.readdirSync(path.join(outputDir, './tiles/diff'));

        diffFiles.forEach(zoom => {
            const zoomFiles = fs.readdirSync(path.join(outputDir, `./tiles/diff/${zoom}`));
            zoomFiles.forEach(x => {
                const imageFiles = fs.readdirSync(path.join(outputDir, `./tiles/diff/${zoom}/${x}`));
                imageFiles.forEach(imgFileName => {
                    const images = [];
                    imgFileName = imgFileName.replace('.png', '');
                    images.push({ path: `server1/${zoom}/${x}/${imgFileName}` });
                    images.push({ path: `server2/${zoom}/${x}/${imgFileName}` });
                    images.push({ path: `diff/${zoom}/${x}/${imgFileName}` });
                    this.reportDiffEntry(images, true);
                });
            });
        });
        console.log(cachedResults)
        this.saveFinalReport(cachedResults);
    }

    addReportHeader(benchmarkResult) {
        const { totalPixels, totalDiffPixels, sampleSize } = benchmarkResult;

        const docSampleSize = this.doc.querySelector("#sampleSize");
        docSampleSize.innerHTML = sampleSize;
        const docPercentageDiffPixels = this.doc.querySelector("#percentageDiffPixels");
        docPercentageDiffPixels.innerHTML = (totalDiffPixels / totalPixels) * 100;
    }

    saveFinalReport(benchmarkResult) {
        this.addReportHeader(benchmarkResult);
        const html = '<!DOCTYPE HTML>' + '\n' + this.doc.documentElement.outerHTML;
        mkdirp(outputDir).then(() => {
            fs.writeFileSync(path.join(outputDir, 'index.html'), html, (err) => {
                if (err) throw err;
            });

            fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(benchmarkResult), (err) => {
                if (err) throw err;
            });
            console.log("Report saved")
        }).catch((err) => {
            if (err) throw err;
        });
        
    }
}