var crypto = require('crypto');
const config = require('./config');
const queryString = require('querystring');
const https = require('https');

let helpers = {};

helpers.hash = (value) => {
    if (typeof (value) === 'string' && value.length > 0) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(value).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonToObject = (value) => {
    try {
        return JSON.parse(value);
    }
    catch (e) {
        return {};
    }
};

helpers.createRandomString = (length) => {
    length = typeof (length) === 'number' && length > 0 ? length : false;

    if (length) {
        let possibleCharacter = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let output = '';

        for (let i = 0; i < length; i++) {
            let randomChar = possibleCharacter.charAt(Math.floor(Math.random() * possibleCharacter.length));
            output += randomChar;
        }

        return output;
    } else {
        return false;
    }
};


helpers.sendSmsViaTwilio = (phone, message, callback) => {
    phone = typeof (phone) === 'string' && phone.trim().length === 10
        ? phone.trim()
        : false;

    message = typeof (message) === 'string' && message.trim().length > 0 && message.trim().length <= 1600
        ? message.trim()
        : false;

    if (phone && message) {
        let payload = queryString.stringify({
            'From': config.twilio.fromPhone,
            'To': '+1' + phone,
            'Body': message
        });

        let requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'content-type': 'application/x-www-form-urlencoded',
                'content-length': Buffer.byteLength(payload)
            }
        };

        let request = https.request(requestDetails, (response) => {
            let statusCode = response.statusCode;
            if (statusCode === 200 || statusCode === 201) {
                callback(false);
            } else {
                callback('Status code returned was ' + statusCode);
            }
        });

        request.on('error', (err) => { callback(err); });
        request.write(payload);
        request.end();

    } else {
        callback('Missing or invalid parameters')
    }
};


helpers.validString = (value) => {
    return typeof (value) === 'string' && value.trim().length > 0 ? value.trim() : false;
};

helpers.validFixedLengthString = (value, length) => {
    return typeof (value) === 'string' && value.trim().length === length ? value.trim() : false;
};

helpers.validStringInRange = (value, range) => {
    return typeof (value) === 'string' && range.indexOf(value.toLowerCase().trim()) !== -1
        ? value.toLocaleLowerCase().trim()
        : false;
};

helpers.validArray = (value) => {
    return typeof (value) === 'object' && value instanceof Array && value.length
        ? value
        : false;
};

helpers.validWholeNumberInRange = (value, min, max) => {
    return typeof (value) === 'number' && value % 1 === 0 && value >= min && value <= max
        ? value
        : false;
};

helpers.validPositiveNumber = (value) => {
    return typeof (value) === 'number' && value > 0
        ? value
        : false;
};

module.exports = helpers;
