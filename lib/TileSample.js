const { sample, all } = require('underscore');

module.exports = class TileSample {
    constructor(options) {
        this.startZoom = options.startZoom;
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
        return Math.max(this.minSize, Math.round(this.arrayOfTotalTiles[zoom].length * (this.maxSizePercentage / 100)))
    }

    getSampleByZoom(zoom, forceSampleSize = null) {
        const sampleSize = forceSampleSize || this.calculateSampleSizeByZoom(zoom);
        return sample(this.arrayOfTotalTiles[zoom], sampleSize);
    }

    getAllZooms() {
        return this.arrayOfTotalTiles.map((elem, index) => {
            if (elem) return index;
        });
    }
}