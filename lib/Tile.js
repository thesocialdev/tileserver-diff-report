var sharp = require('sharp');
var mbgl = require('@mapbox/mapbox-gl-native');
var request = require('request');
const throttledRequest = require('throttled-request')(request);

const throttleConfig = {
    requests: 5,
    milliseconds: 500
};

throttledRequest.configure(throttleConfig);

class Tile {

    constructor(options) {
        this.type = options.type || "raster";
        this.ratio = options.ratio || 1;
        if (this.type === "vector") {
            this.map = new mbgl.Map({
                request: this.vectorTileRequest,
                ratio: this.ratio,
            });
            this.map.load(require(options.style));
        } else if (this.type === "raster") {
            this.uri = options.uri;
        } else {
            throw Error("tile type not supported")
        }
    }

    vectorTileRequest(req, callback) {
        request({
            url: req.url,
            encoding: null,
            gzip: true
        }, function (err, res, body) {
            if (err) {
                callback(err);
            } else if (res.statusCode == 200) {
                var response = {};

                if (res.headers.modified) { response.modified = new Date(res.headers.modified); }
                if (res.headers.expires) { response.expires = new Date(res.headers.expires); }
                if (res.headers.etag) { response.etag = res.headers.etag; }
                response.data = body;
                callback(null, response);
            } else {
                callback(new Error(JSON.parse(body).message));
            }
        });
    }

    async rasterTileRequest(params, errCallback) {
        const uri = this.uri;
        return new Promise((resolve) => {
            throttledRequest({ method: "GET", uri, encoding: null, qs: params }, function(err, res){
                // console.log("Requesting: " + url)
                if (err) {
                    errCallback();
                }
                resolve(res && res.body);
            });
        });
    }

    renderVectorTile(params, errCallback) {
        let self = this;
        const { width, height } = params;

        return new Promise((resolve) => {
            this.map.render(params, function(err, buffer) {
                if (err) errCallback();
                self.map.release();
                const img =  sharp(buffer, {
                    raw: {
                        width: width * self.ratio,
                        height: height * self.ratio,
                        channels: 4
                    }
                }).png().toBuffer();
                resolve(img);
            });
        })
    }

    async get(params, errCallback) {
        if (this.type === "raster") {
            return this.rasterTileRequest(params, errCallback);
        } else if (this.type === "vector") {
            return this.renderVectorTile(params, errCallback);
        }
    }
}

module.exports = Tile;
