let fs = require('fs');
let path = require('path');
const helpers = require('./helpers');

let lib = {};

lib.baseDirectory = path.join(__dirname, '../.data/');

lib.create = (dir, file, data, callback) => {
    const fileToCreate = lib.baseDirectory + dir + '/' + file + '.json';
    const fileFlags = 'wx';

    fs.open(fileToCreate, fileFlags, (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('There was an error closing the file');
                        }
                    });

                } else {
                    callback('There was an error writing to the new file.');
                }
            });
        } else {
            callback('Could not create new file, it may already exist.');
        }
    });
};

lib.read = (dir, file, callback) => {
    const fileToRead = lib.baseDirectory + dir + '/' + file + '.json';

    fs.readFile(fileToRead, 'utf8', (err, data) => {
        if (!err) {
            callback(false, helpers.parseJsonToObject(data));
        } else {
            callback(err, data);
        }
    });
};

lib.update = (dir, file, data, callback) => {
    const fileToUpdate = lib.baseDirectory + dir + '/' + file + '.json';
    const fileFlags = 'r+';

    fs.open(fileToUpdate, fileFlags, (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);

            fs.ftruncate(fileDescriptor, (err) => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('There was an error closing the file');
                                }
                            });
                        } else {
                            callback('There was an error writing to the file.');
                        }
                    });
                } else {
                    callback('Could not truncate file');
                }
            });
        } else {
            callback('Could not update file, it may not exist.');
        }
    });
};

lib.delete = (dir, file, callback) => {
    const fileToDelete = lib.baseDirectory + dir + '/' + file + '.json';
    fs.unlink(fileToDelete, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('There was an error deleting the file');
        }
    });
};

lib.list = (dir, callback) => {
    fs.readdir(lib.baseDirectory + dir + '/', (err, data) => {
        if (!err && data && data.length) {
            let trimmedFileNames = data.map(d => { return d.replace('.json', ''); });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
};

module.exports = lib;