const config = require('./config');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const handlers = require('./handlers');
const helpers = require('./helpers');

const StringDecoder = require('string_decoder').StringDecoder;

var server = {};


server.unifiedServer = (request, response) => {
    const parseQueryString = true;
    let parsedUrl = url.parse(request.url, parseQueryString);

    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    let method = request.method.toLowerCase();
    let queryString = parsedUrl.query;
    let headers = request.headers;

    let decoder = new StringDecoder('utf-8');
    let buffer = '';

    request.on('data', (data) => {
        buffer += decoder.write(data);
    });

    request.on('end', () => {
        buffer += decoder.end();

        let chosenHandler = server.router[trimmedPath] || handlers.notFound;

        let data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryString': queryString,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, (statusCode, payload) => {
            const defaultStatusCode = 200;
            const defaultPayload = {};
            statusCode = typeof (statusCode) === 'number' ? statusCode : defaultStatusCode;
            payload = typeof (payload) === 'object' ? payload : defaultPayload;
            let payloadString = JSON.stringify(payload);

            response.setHeader('content-type', 'application/json');
            response.writeHead(statusCode);
            response.end(payloadString);

            console.log('Request received:', method, trimmedPath, queryString, headers, buffer);
            console.log('Response sent:', statusCode, payloadString);
        });

    });
};


server.httpServer = http.createServer((request, response) => { server.unifiedServer(request, response); });


server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (request, response) => { server.unifiedServer(request, response); });






server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

server.init = () => {
    server.httpServer.listen(config.httpPort, function () {
        console.log('Server is listening on port ' + config.httpPort + ' for environment ' + config.envName);
    });

    server.httpsServer.listen(config.httpsPort, function () {
        console.log('Secure server is listening on port ' + config.httpsPort + ' for environment ' + config.envName);
    });

};

module.exports = server;