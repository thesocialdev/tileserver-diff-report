const pixelmatch = require('pixelmatch');
const request = require('axios');
const PNG = require('pngjs').PNG;
const Report = require('./Report');
const throttledRequest = require('throttled-request')(request);
const {performance} = require('perf_hooks');

throttledRequest.configure({
    requests: 10,
    milliseconds: 1000
});

module.exports = class Benchmark {
    constructor(sample, options) {
        this.sample = sample;
        this.options = options;
        this.results = {
            difftiles: [],
            totalDiffPixels: 0,
            totalPixels: 0,
            sampleSize: 0,
        }
        this.report = new Report();
    }

    async getImages(tile = '7/68/47') {
        const debug = '7/68/47';
        return {
            img1: await this.getSingleImage(`${this.options.servers[0].host}/osm-intl/${tile}@2x.png`),
            img2: await this.getSingleImage(`${this.options.servers[1].host}/osm-intl/${tile}@2x.png`),
        }
    }

    async getSingleImage(url) {
        const img = await request.get(url, { responseType: 'arraybuffer' }).catch((err) => {
            // console.log(err);
        });
        return img && img.data && PNG.sync.read(img.data);
    }

    async exec() {
        console.time();
        const timeStart = performance.now();
        const sample = this.sample;
        
        const result = sample.getAllZooms().map((zoom) => {
            const coordinates = sample.getSampleByZoom(zoom);
            console.log(`Sample size for zoom ${zoom} is ${coordinates.length}`);
            this.results.difftiles[zoom] = [];
            return Promise.all(coordinates.map(async (coordinate) => {
                return new Promise(async (resolve) => {
                    const tile = `${zoom}/${coordinate}`;
                    const {img1, img2} = await this.getImages(tile);
                    if (img1 && img2) {
                        const {width, height} = img1;
                        const diff = new PNG({width, height});

                        const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: this.options.threshold});
                        this.results.totalDiffPixels += diffPixels;
                        this.results.totalPixels += width * height;
                        this.results.sampleSize ++;
                        if (diffPixels > 0) {
                            this.results.difftiles[zoom][coordinate] = {
                                diffPixels,
                                totalPixels: width * height,
                            }

                            const diffImages = [
                                {blob: PNG.sync.write(img1), path: `server1/${tile}`},
                                {blob: PNG.sync.write(img2), path: `server2/${tile}`},
                                {blob: PNG.sync.write(diff), path: `diff/${tile}`},
                            ];

                            this.report.reportDiffEntry(diffImages);
                        }
                    }

                    resolve();
                });
            }));
        });
        Promise.all(result).then(() => {
            console.timeEnd();
            const timeEnd = performance.now();
            console.log(`${timeEnd - timeStart}ms`);
            this.report.saveFinalReport(this.results);
        })
    }
}