var http = require('http'),
    https = require('https'),
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
