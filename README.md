# Node.js Proxy
More easier and organized way of creating a proxy.

## Example:

```javascript
var http = require('http'),
    proxy = require('./proxy');

http.createServer((req, res) => proxy({
    url(req){
        return 'https://example.org' + req.url;
    },
    request(data){
        if (data.clientRequest.url == '/test') return data.clientResponse.end('Access denied!');
    },
    response(data){
        data.removeCompression();
        if (data.clientRequest.url == '/cat') data.body = data.body.toString().replace('Example Domain', 'Cats are awesome!');
    },
})(req, res)).listen(8080);
```

## API:

```javascript
{
    url(clientRequest){ // URL handler. Returns URL used in the request.
        return 'https://example.org' + clientRequest.url;
    },
    request(data){ // Remote request handler. 
        data.url; // URL instance.
        data.headers; // Headers sent in request.
        data.body; // Request body, returns null if none.
        data.clientRequest; // HTTP Client Request object.
        data.clientResponse; // HTTP Client Response object.
    },
    response(data){ // Remote response handler.
        data.url; // URL instance.
        data.headers; // Headers received from response.
        data.body; // Response body, returns null if none.
        data.clientRequest; // HTTP Client Request object.
        data.clientResponse; // HTTP Client Response object.
        data.remoteResponse; // HTTP Remote Response object.
        data.removeCompression(); // Removes Content-Encoding compression & Content-Length response header.
        data.removePolicies(); // Removes X-Frame-Options, Content-Security-Policy, Content-Security-Policy-Report-Only, and Strict-Transport-Security response headers.
    },
}
