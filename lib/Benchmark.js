const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const Report = require('./Report');
const {performance} = require('perf_hooks');
const Tile = require("../lib/Tile");
const mercator = new (require('@mapbox/sphericalmercator'))();

function moduleIsAvailable (path) {
    try {
        require.resolve(path);
        return true;
    } catch (e) {
        return false;
    }
}

const path = '../output/results.json';
const previousResults = moduleIsAvailable(path) ? require(path) : {};
module.exports = class Benchmark {
    constructor(sample, options) {
        this.sample = sample;
        this.options = options;
        this.totalSample = this.sample.getTotalSample();
        this.executionCounter = 0;
        this.results = Object.assign(
            {
                difftiles: {},
                totalDiffPixels: 0,
                totalPixels: 0,
                sampleSize: 0,
                executionPerf: []
            },
            previousResults
        );
        this.report = new Report();
    }

    async getImages(zoom, coordinate, lang) {
        const debug = '7/68/47';
        return {
            img1: await this.getSingleImage({
                ...this.options.servers[0],
                zoom,
                coordinate,
                params: {
                    lang,
                    ...this.options.servers[0].params
                }
            }),
            img2: await this.getSingleImage({
                ...this.options.servers[1],
                zoom,
                coordinate,
                params: {
                    lang,
                    ...this.options.servers[1].params
                }
            }),
        }
    }

    async getSingleImage(options) {
        const zoom = options.zoom;
        const tileCoordinates = options.coordinate.split('/').map(e => {
            return parseInt(e);
        });
        // https://github.com/maptiler/tileserver-gl/blob/master/src/serve_rendered.js#L382
        const center = mercator.ll([
            ((tileCoordinates[0] + 0.5) / (1 << zoom)) * (256 << zoom),
            ((tileCoordinates[1] + 0.5) / (1 << zoom)) * (256 << zoom)
        ], zoom);
        const tile = new Tile({
            type: options.type,
            zoom,
            center,
            style: options.style,
            format: "png",
            uri: `${options.host}/${options.zoom}/${options.coordinate}@2x.png`
        });

        const img = await tile.get({
            ...options.params,
            zoom,
            center
        }, (err) => {
            console.log(err);
            this.report.saveFinalReport(this.results);
        });
        return img && PNG.sync.read(img);
    }

    async checkDiff(zoom, coordinate, lang) {
        const tile = `${zoom}/${coordinate}`;
        const {img1, img2} = await this.getImages(zoom, coordinate, lang);
        if (img1 && img2) {
            const {width, height} = img1;
            const diff = new PNG({width, height});
            const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: this.options.threshold});
            this.results.totalDiffPixels += diffPixels;
            this.results.totalPixels += width * height;
            this.results.sampleSize ++;
            this.executionCounter ++;
            const percentage = Math.round((this.executionCounter / this.totalSample) * 100);
            this.printProgress(percentage, this.executionCounter, this.totalSample);

            if (diffPixels > 0) {
                const { x, y } = this.extractXYFromCoordinateString(coordinate);
                if ( !Array.isArray(this.results.difftiles[zoom][x])) {
                    this.results.difftiles[zoom][x] = [];
                }

                this.results.difftiles[zoom][x][y] = {
                    coordinate,
                    diffPixels,
                    totalPixels: width * height,
                    lang,
                }

                const diffImages = [
                    {blob: PNG.sync.write(img1), path: `server1/${tile}`},
                    {blob: PNG.sync.write(img2), path: `server2/${tile}`},
                    {blob: PNG.sync.write(diff), path: `diff/${tile}`},
                ];

                this.report.reportDiffEntry(diffImages);
            }
        }
    }


    printProgress(progress, acc, total){
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Running: ${progress}% (${acc}/${total})`);
    }

    extractXYFromCoordinateString(coordinate) {
        const coords = coordinate.split("/");
        return {
            x: coords[0],
            y: coords[1]
        }
    }

    async exec(lang = null) {
        this.executionCounter = 0;
        console.time();
        this.timeStart = performance.now();
        const sample = this.sample;

        return Promise.all(sample.getAllZooms().map((zoom) => {
            const coordinates = sample.getSampleByZoom(zoom);
            this.results.difftiles[zoom] = [];
            return Promise.all(coordinates.map(async (coordinate) => this.checkDiff(zoom, coordinate, lang)));
        })).then(() => {
            process.stdout.write('\n');
            this.timeEnd = performance.now();
            this.results.executionPerf.push({
                timeEnd: this.timeEnd,
                timeStart: this.timeStart,
                lang
            })
            this.report.saveFinalReport(this.results);
        })
    }
}
