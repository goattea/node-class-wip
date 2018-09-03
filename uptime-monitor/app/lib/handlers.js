const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

let handlers = {};

handlers.ping = (data, callback) => {
    callback(200);
};

handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) !== -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._users = {
    'post': (data, callback) => {
        const firstName = validString(data.payload.firstName);
        const lastName = validString(data.payload.lastName);
        const phone = validFixedLengthString(data.payload.phone, 10);
        const password = validString(data.payload.password);
        const tosAgreement = typeof (data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement;

        if (firstName && lastName && phone && password && tosAgreement) {
            _data.read('users', phone, (err, data) => {
                if (err) {
                    const hashPassword = helpers.hash(password);
                    if (hashPassword) {
                        var userObject = {
                            firstName: firstName,
                            lastName: lastName,
                            phone: phone,
                            hashPassword: hashPassword,
                            tosAgreement: tosAgreement
                        };

                        _data.create('users', phone, userObject, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500, { 'Error': 'Could not create new user' });
                            }

                        });
                    } else {
                        callback(500, { 'Error': 'Could not hash password' });
                    }
                } else {
                    callback(400, { 'Error': 'A user with that phone number already exists' });
                }
            });

        } else {
            callback(400, { 'Error': 'Missing required fields' });
        }
    },
    'get': (data, callback) => {
        let phone = validFixedLengthString(data.queryString.phone, 10);

        if (phone) {
            const token = validString(data.headers.token);

            handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
                if (isTokenValid) {
                    _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            delete data.hashPassword;
                            callback(200, data);
                        } else {
                            callback(404);
                        }
                    });
                } else {
                    callback(403, { 'Error': 'Missing or invalid token' });
                }
            });


        } else {
            callback(400, { 'Error': 'Missing required field.' });
        }
    },
    'put': (data, callback) => {
        let phone = validFixedLengthString(data.payload.phone, 10);
        const firstName = validString(data.payload.firstName);
        const lastName = validString(data.payload.lastName);
        const password = validString(data.payload.password);

        if (phone && (firstName || lastName || password)) {
            const token = validString(data.headers.token);

            handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
                if (isTokenValid) {

                    _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            if (firstName) { data.firstName = firstName; }
                            if (lastName) { data.lastName = lastName; }
                            if (password) { data.hashPassword = helpers.hash(data.password); }

                            _data.update('users', phone, data, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Could not update user' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'Specified user does not exist.' });
                        }
                    });

                } else {
                    callback(403, { 'Error': 'Missing or invalid token' });
                }
            });

        } else {
            callback(400, { 'Error': 'Missing required field.' });
        }
    },
    'delete': (data, callback) => {
        let phone = validFixedLengthString(data.queryString.phone, 10);

        if (phone) {
            const token = validString(data.headers.token);

            handlers._tokens.verifyToken(token, phone, (isTokenValid) => {
                if (isTokenValid) {
                    _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            let userChecks = validArray(data.checks);

                            if (userChecks) {
                                userChecks.foreach((checkId) => {
                                    _data.delete('checks', checkId, (err) => { });
                                });
                            }
                            
                            _data.delete('users', phone, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'Error': 'User could not be deleted' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'User not found.' });
                        }
                    });
                } else {
                    callback(403, { 'Error': 'Missing or invalid token' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing required field.' });
        }
    }
};


handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) !== -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._tokens = {
    'post': (data, callback) => {
        const phone = validFixedLengthString(data.payload.phone, 10);
        const password = validString(data.payload.password);

        if (phone && password) {
            _data.read('users', phone, (err, userData) => {
                if (!err) {
                    let passwordHash = helpers.hash(password);
                    if (passwordHash == userData.hashPassword) {
                        let tokenId = helpers.createRandomString(20);
                        let expires = Date.now() + 1000 * 60 * 60; // one hour from now
                        let tokenObject = {
                            'phone': phone,
                            'id': tokenId,
                            'expires': expires
                        };

                        _data.create('tokens', tokenId, tokenObject, (err) => {
                            if (!err) {
                                callback(200, tokenObject);
                            } else {
                                callback(500, { 'Error': 'Could not generate token.' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Invalid user password.' });
                    }
                } else {
                    callback(400, { 'Error': 'Could not find specified user' });
                }
            });

        } else {
            callback(400, { 'Error': 'Missing required fields' });
        }
    },
    'get': (data, callback) => {
        let tokenId = validFixedLengthString(data.queryString.id, 20);

        if (tokenId) {
            _data.read('tokens', tokenId, (err, data) => {
                if (!err && data) {
                    callback(200, data);
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, { 'Error': 'Missing required field.' });
        }
    },
    'put': (data, callback) => {
        const tokenId = validFixedLengthString(data.payload.id, 20);
        const extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend;

        if (tokenId && extend) {
            _data.read('tokens', tokenId, (err, data) => {
                if (!err && data) {
                    if (data.expires > Date.now()) {
                        data.expires = Date.now() + 1000 * 60 * 60;

                        _data.update('tokens', tokenId, data, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500, { 'Error': 'Could not extend token expiration' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Cannot extend an expired token' });
                    }
                } else {
                    callback(400, { 'Error': 'Specified user does not exist.' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing required field.' });
        }
    },
    'delete': (data, callback) => {
        let tokenId = validFixedLengthString(data.queryString.id, 20);

        if (tokenId) {
            _data.read('tokens', tokenId, (err, data) => {
                if (!err && data) {
                    _data.delete('tokens', tokenId, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Token could not be deleted' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Token not found.' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing required field.' });
        }
    },

    'verifyToken': (tokenId, phone, callback) => {
        _data.read('tokens', tokenId, (err, data) => {
            if (!err) {
                if (data.phone === phone && data.expires > Date.now()) {
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    }
};


handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) !== -1) {
        const token = validString(data.headers.token);
        if (token) {
            _data.read('tokens', token, (err, tokenData) => {
                if (!err && tokenData) {
                    handlers._checks[data.method](data, tokenData, callback);
                } else {
                    callback(403);
                }
            });
        } else {
            callback(403);
        }
    } else {
        callback(405);
    }
};

handlers._checks = {
    'post': (data, tokenData, callback) => {
        const protocol = validStringInRange(data.payload.protocol, ['http', 'https']);
        const url = validString(data.payload.url);
        const method = validStringInRange(data.payload.method, ['post', 'put', 'get', 'delete', 'head']);
        const successCodes = validArray(data.payload.successCodes);
        const timeoutSeconds = validWholeNumberInRange(data.payload.timeoutSeconds, 1, 5);

        if (protocol && method && successCodes && timeoutSeconds && url) {

            _data.read('users', tokenData.phone, (err, userData) => {
                if (!err && userData) {
                    let userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array
                        ? userData.checks
                        : [];
                    if (userChecks.length < config.maxChecks) {
                        const checkId = helpers.createRandomString(20);
                        const checkObject = {
                            id: checkId,
                            userPhone: userData.phone,
                            protocol: protocol,
                            url: url,
                            method: method,
                            successCodes: successCodes,
                            timeoutSeconds: timeoutSeconds
                        };

                        _data.create('checks', checkId, checkObject, (err) => {
                            if (!err) {
                                userChecks.push(checkId);
                                userData.checks = userChecks;

                                _data.update('users', userData.phone, userData, (err) => {
                                    if (!err) {
                                        callback(200, checkObject);
                                    } else {
                                        callback(500, { 'Error': 'Could not update user data with new check' });
                                    }
                                });
                            } else {
                                callback(500, { 'Error': 'Could not create new check' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Maximum number of checks already defined (' + config.maxChecks + ')' });
                    }
                } else {
                    callback(404, { 'Error': 'Could not find user data' });
                }
            });

        } else {
            callback(400, { 'Error': 'Missing required inputs' });
        }
    },
    'get': (data, tokenData, callback) => {
        let checkId = validFixedLengthString(data.queryString.id, 20);

        if (checkId) {
            _data.read('checks', checkId, (err, checkData) => {
                if (!err && checkData) {
                    if (checkData.userPhone == tokenData.phone) {
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, { 'Error': 'Missing or invalid required field' });
        }
    },
    'put': (data, tokenData, callback) => {
        let checkId = validFixedLengthString(data.payload.id, 20);
        const protocol = validStringInRange(data.payload.protocol, ['http', 'https']);
        const url = validString(data.payload.url);
        const method = validStringInRange(data.payload.method, ['post', 'put', 'get', 'delete', 'head']);
        const successCodes = validArray(data.payload.successCodes);
        const timeoutSeconds = validWholeNumberInRange(data.payload.timeoutSeconds, 1, 5);

        if (checkId && (protocol || url || method || successCodes || timeoutSeconds)) {

            _data.read('checks', checkId, (err, checkData) => {
                if (!err && checkData) {
                    if (checkData.userPhone == tokenData.phone) {
                        if (protocol) { checkData.protocol = protocol; }
                        if (url) { checkData.url = url; }
                        if (method) { checkData.method = method; }
                        if (successCodes) { checkData.successCodes = successCodes; }
                        if (timeoutSeconds) { checkData.timeoutSeconds = timeoutSeconds; }

                        _data.update('checks', checkId, checkData, (err) => {
                            if (!err) {
                                callback(200, checkData);
                            } else {
                                console.log(err);
                                callback(500, { 'Error': 'Could not update user check' });
                            }
                        });
                    } else {
                        callback(403);
                    }
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, { 'Error': 'Missing or invalid required field.' });
        }
    },
    'delete': (data, tokenData, callback) => {
        let checkId = validFixedLengthString(data.queryString.id, 20);

        if (checkId) {
            _data.read('users', tokenData.phone, (err, userData) => {
                if (!err && userData) {
                    let checkIdIdx = userData.checks.indexOf(checkId);
                    if (checkIdIdx !== -1) {
                        _data.delete('checks', checkId, (err) => {
                            if (!err) {
                                userData.checks.splice(checkIdIdx, 1);
                                _data.update('users', tokenData.phone, userData, (err) => {
                                    if (!err) {
                                        callback(200);
                                    } else {
                                        callback(500, { 'Error': 'Could not persist check changes to user info' });
                                    }
                                })
                            } else {
                                callback(500, { 'Error': 'Check could not be deleted' });
                            }
                        });
                    } else {
                        callback(404);
                    }
                } else {
                    callback(400, { 'Error': 'User not found.' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing or invalid required field.' });
        }
    }
};



const validString = (value) => {
    return typeof (value) === 'string' && value.trim().length > 0 ? value.trim() : false;
};

const validFixedLengthString = (value, length) => {
    return typeof (value) === 'string' && value.trim().length === length ? value.trim() : false;
};

const validStringInRange = (value, range) => {
    return typeof (value) === 'string' && range.indexOf(value.toLowerCase().trim()) !== -1
        ? value.toLocaleLowerCase().trim()
        : false;
};

const validArray = (value) => {
    return typeof (value) === 'object' && value instanceof Array && value.length
        ? value
        : false;
};

const validWholeNumberInRange = (value, min, max) => {
    return typeof (value) === 'number' && value % 1 === 0 && value >= min && value <= max
        ? value
        : false;
};

handlers.notFound = (data, callback) => {
    callback(404);
};

module.exports = handlers;