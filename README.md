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
