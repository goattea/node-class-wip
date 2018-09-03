// create and export environment variables

let environments = {};

environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging',
    hashingSecret: 'supersecret',
    maxChecks: 5,
    twilio: {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
};

environments.production = {
    port: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'supersecret',
    maxChecks: 5,
    twilio: {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
};

environments.default = environments.staging;

let currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ?
    process.env.NODE_ENV.toLowerCase() :
    '';

let environmentToExport = typeof (environments[currentEnvironment]) === 'object' ?
    environments[currentEnvironment] :
    environments.default;

module.exports = environmentToExport;