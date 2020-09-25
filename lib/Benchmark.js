const pixelmatch = require('pixelmatch');
const request = require('axios');
const PNG = require('pngjs').PNG;
const Report = require('./Report');

module.exports = class Benchmark {
    constructor(sample, options) {
        this.sample = sample;
        this.options = options;
        this.results = {
            difftiles: [],
            totalDiffPixels: 0,
            totalPixels: 0,
        }
        this.report = new Report();
    }

    async getImages(tile = '7/68/47') {
        console.log(`${this.options.servers[0].host}/osm-intl/${tile}@2x.png`);
        return {
            img1: await this.getSingleImage(`${this.options.servers[0].host}/osm-intl/${tile}@2x.png`),
            img2: await this.getSingleImage(`${this.options.servers[1].host}/osm-intl/${tile}@2x.png`),
        }
    }

    async getSingleImage(url) {
        const img = await request.get(url, { responseType: 'arraybuffer' });
        return img && img.data && PNG.sync.read(img.data);
    }

    async exec() {
        const sample = this.sample;
        sample.getAllZooms().forEach((zoom) => {
            const coordinates = sample.getSampleByZoom(zoom);
            coordinates.forEach(async (coordinate) => {
                const tile = `${zoom}/${coordinate}`;
                const {img1, img2} = await this.getImages(tile);
                const {width, height} = img1;
                const diff = new PNG({width, height});

                const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: this.options.threshold});
                this.results.totalDiffPixels += diffPixels;
                this.results.totalPixels += width * height;
                if (diffPixels > 0) {
                    this.results.difftiles[zoom][coordinate] = {
                        diffPixels,
                        totalPixels: width * height,
                    }

                    this.report.saveImageToFileSystem(PNG.sync.write(diff), `diff/${tile}`);
                    this.report.saveImageToFileSystem(img1, `server1/${tile}`);
                    this.report.saveImageToFileSystem(img2, `server2/${tile}`);
                }
            });
        });
        
    }
}