var http = require('http'),
    https = require('https'),
    zlib = require('zlib'),
    defaultConfig = {
        url: URL.prototype || '' || Function.prototype,
        requestHandler(data){},
        responseHandler(data){},
        errorHandler(data){
            data.clientResponse.end(data.error.toString());
        },
    };

module.exports = function proxy(config = defaultConfig){
    var config = Object.assign(defaultConfig, config);
    return async function(clientRequest = http.IncomingMessage.prototype, clientResponse = http.ServerResponse.prototype){
        try { 
            var requestData = {
                    url: typeof config.url == 'function' ? new URL(config.url(clientRequest)) : new URL(config.url),
                    headers: { ...clientRequest.headers },
                    body: await getChunks(clientRequest),
                    clientRequest,
                    clientResponse,
                };

            delete requestData.headers['host'];

            config.requestHandler(requestData);

            if (clientResponse.writableEnded) return;

            (requestData.url.protocol == 'https:' ? https : http).request({
                headers: requestData.headers,
                method: clientRequest.method,
                rejectUnauthorized: false,
                port: requestData.url.port,
                host: requestData.url.hostname,
                path: requestData.url.pathname + requestData.url.search,
            }, async remoteResponse => {
                var remoteData = {
                    url: requestData.url,
                    headers: { ...remoteResponse.headers },
                    body: await getChunks(remoteResponse),
                    clientRequest,
                    clientResponse,
                    remoteResponse,
                    removeCompression(){
                        switch((this.headers['content-encoding'] || null)){
                            case 'gzip':
                                this.body = zlib.gunzipSync(this.body, { 
                                    flush: zlib.constants.Z_SYNC_FLUSH, 
                                    finishFlush: zlib.constants.Z_SYNC_FLUSH,
                                });
                                break;
                            case 'deflate':
                                this.body = zlib.inflateSync(body, { 
                                    flush: zlib.constants.Z_SYNC_FLUSH, 
                                    finishFlush: zlib.constants.Z_SYNC_FLUSH,
                                });
                                break;
                            case 'br':
                                this.body =zlib.brotliDecompressSync(this.body, { 
                                    flush: zlib.constants.Z_SYNC_FLUSH, 
                                    finishFlush: zlib.constants.Z_SYNC_FLUSH,
                                });
                        };
                        delete this.headers['content-encoding'];
                        delete this.headers['content-length'];
                    },
                };

                config.responseHandler(remoteData);

                if (clientResponse.writableEnded) return;

                clientResponse.writeHead(remoteResponse.statusCode, remoteData.headers)
                clientResponse.end(remoteData.body);
            }).on('error', error => 
                config.errorHandler({ 
                    clientRequest,
                    clientResponse,
                    error,
                })
            ).end(requestData.body);
        } catch(error) {
            config.errorHandler({ 
                clientRequest,
                clientResponse,
                error,
            });
        };
    };
};

function getChunks(stream) {
    var chunks = [];
    return new Promise(resolve => stream.on('data', data => chunks.push(data)).on('end', () => chunks.length ? resolve(Buffer.concat(chunks)) : resolve(null)));
};
