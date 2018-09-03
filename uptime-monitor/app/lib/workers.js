const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const data = require('./data');
const helpers = require('./helpers');

let workers = {};

workers.gatherAllChecks = () => { 
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length) {
            checks.forEach(checkId => {
                _data.read('checks', checkId, (err, originalCheckData) => {
                    if (!err) {
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Could not read check data for ' + checkId);
                    }
                });
            });
        } else {
            if (err) {
                console.log('Error reading checks', err);    
            } else {
                console.log('Worker found no checks to process...')
            }
        }
    });
};

workers.validateCheckData = (checkData) => { };

workers.loop = () => { 
    setInterval(() => {
        workers.gatherAllChecks();
     }, 1000 * 60);
};

workers.init = () => {
    workers.gatherAllChecks();
    workers.loop();
};

module.exports = workers;