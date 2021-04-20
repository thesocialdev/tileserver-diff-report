const fs = require('fs');
const Benchmark = require('./lib/Benchmark');
const TileSample = require('./lib/TileSample')

const options = {
    sample: {
        startZoom: 6,//4/11/6
        startX: 35,
        startY: 23,
        execFromZoom: 6,
        endZoom: 7,
        maxSizePercentage: 5,
        minSize: 150,
    },
    benchmark: {
        servers: [
            {
                type: "vector",
                style: '../osm-bright.json',
                label: 'OpenMapTiles',
                params: {
                    width: 512,
                    height: 512,
                    format: 'png'
                }
            },
            {
                type: "raster",
                host: 'https://maps.wikimedia.org/osm',
                label: 'Kartotherian'
            },
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
    // console.log("Executing for language pt");
    // benchmark.exec("pt").then(() => {
    //     console.log("Executing for language zh");
    //     benchmark.exec("zh").then(() => {
    //         console.log("Executing for language ru");
    //         benchmark.exec("ru").then(() => {
    //             console.log("Executing for language cr");
    //             benchmark.exec("cr");
    //         });
    //     });
    // });
});
