const fs = require('fs');
const Benchmark = require('./lib/Benchmark');
const TileSample = require('./lib/TileSample')

const options = {
    sample: {
        startZoom: 3,//9/305/208
        startX: 4,
        startY: 4,
        execFromZoom:12,
        endZoom: 13,
        maxSizePercentage: 5,
        minSize: 150,  
    },
    benchmark: {
        servers: [
            { host: 'http://localhost:6533/osm-intl', label: 'imposm3'},
            { host: 'http://localhost:6534/osm-intl', label: 'osm2pgsql'},
        ],
        threshold: 0.1,
    }
}

let sample = new TileSample(options.sample);
let benchmark = new Benchmark(sample, options.benchmark);

[ "en", "pt", "zh", "ru", "cr"].forEach(async (lang) => {
    
});

console.log("Executing for language en");
benchmark.exec("en").then(() => {
    console.log("Executing for language pt");
    benchmark.exec("pt").then(() => {
        console.log("Executing for language zh");
        benchmark.exec("zh").then(() => {
            console.log("Executing for language ru");
            benchmark.exec("ru").then(() => {
                console.log("Executing for language cr");
                benchmark.exec("cr");
            });
        });
    });
});
