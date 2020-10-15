const fs = require('fs');
const Benchmark = require('./lib/Benchmark');
const TileSample = require('./lib/TileSample')

const options = {
    sample: {
        startZoom: 4,//9/305/208
        endZoom: 14,
        startX: 9,
        startY: 6,
        maxSizePercentage: 5,
        minSize: 150,  
    },
    benchmark: {
        servers: [
            { host: 'http://localhost:6533', label: 'imposm3'},
            { host: 'http://localhost:6534', label: 'osm2pgsql'},
        ],
        threshold: 0.1,
    }
}

let sample = new TileSample(options.sample);
let benchmark = new Benchmark(sample, options.benchmark);
benchmark.exec();
