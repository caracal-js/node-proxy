var http = require('http'),
    proxy = require('./proxy');

http.createServer((req, res) => proxy({
    url(req){
        return 'https://example.org' + req.url;
    },
    requestHandler(data){
        if (data.clientRequest.url == '/test') return data.clientResponse.end('Access denied!');
    },
    responseHandler(data){
        data.removeCompression();
        if (data.clientRequest.url == '/cat') data.body = data.body.toString().replace('Example Domain', 'Cats are awesome!');
    },
})(req, res)).listen(8080);
