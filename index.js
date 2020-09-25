const fs = require('fs');
const Benchmark = require('./lib/Benchmark');
const TileSample = require('./lib/TileSample')

const options = {
    sample: {
        startZoom: 3, 
        endZoom: 5, 
        startX: 4, 
        startY: 2,
        maxSizePercentage: 0.01,
        minSize: 150,  
    },
    benchmark: {
        servers: [
            { host: 'https://maps.wikimedia.org', label: 'imposm3'},
            { host: 'https://maps.wikimedia.org', label: 'osm2pgsql'},
        ],
        threshold: 0.1,
    }
}

let sample = new TileSample(options.sample);
let benchmark = new Benchmark(sample, options.benchmark);
benchmark.exec();
