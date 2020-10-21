const { sample, all } = require('underscore');

module.exports = class TileSample {
    constructor(options) {
        this.startZoom = options.startZoom;
        this.execFromZoom = options.execFromZoom;
        this.endZoom = options.endZoom;
        this.startX = options.startX;
        this.startY = options.startY;
        this.maxSizePercentage = options.maxSizePercentage || 5;
        this.minSize = options.minSize || 150;
        this.arrayOfTotalTiles = [];
        this.getArrayOfTiles(this.startZoom, this.endZoom, this.startX, this.startY, this.arrayOfTotalTiles);
    }

    getArrayOfTiles(startZoom, endZoom, x, y, acc = []) {
        if (startZoom === endZoom) {
            return;
        }
        if (acc[startZoom] === undefined) acc[startZoom] = [];
        acc[startZoom].push(`${x}/${y}`);
        this.getArrayOfTiles(startZoom + 1, endZoom, x*2, y*2, acc);
        this.getArrayOfTiles(startZoom + 1, endZoom, x*2 + 1, y*2, acc);
        this.getArrayOfTiles(startZoom + 1, endZoom, x*2, y*2 + 1, acc);
        this.getArrayOfTiles(startZoom + 1, endZoom, x*2 + 1, y*2 + 1, acc);
    }

    calculateSampleSizeByZoom(zoom) {
        return Math.max(this.minSize, Math.round(this.getTiles()[zoom].length * (this.maxSizePercentage / 100)))
    }

    getSampleByZoom(zoom, forceSampleSize = null) {
        const sampleSize = forceSampleSize || this.calculateSampleSizeByZoom(zoom);
        return sample(this.getTiles()[zoom], sampleSize);
    }

    getTiles() {
        return this.arrayOfTotalTiles.map((value, zoom) => {
            return zoom >= this.execFromZoom ? value : [];
        })
    }

    getTotalSample() {
        return this.getTiles().reduce((acc, value, zoom) => {
            return acc + this.getSampleByZoom(zoom).length;
        }, 0);
    }

    getTotalTilesByZoom(zoom) {
        return this.getTiles()[zoom].length;
    }

    getAllZooms() {
        return this.getTiles().map((elem, index) => {
            if (elem) return index;
        });
    }
}