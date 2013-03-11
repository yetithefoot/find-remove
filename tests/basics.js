var   testCase = require('nodeunit').testCase
    , randomstring = require('randomstring')
    , mkdirp = require('mkdirp')
    , path = require('path')
    , fs = require('fs')
    , async = require('async')
    , rimraf = require('rimraf')
    , findRemove
    , removeAll;

var rootDirectory = path.join(require('os').tmpDir(), 'find-remove');

function generateRandomFilename(ext) {
    var filename = randomstring.generate(24);

    if (ext)
        filename += '.' + ext;

    return  filename;
}

// pre defined directories
var directory1 = path.join(rootDirectory, 'directory1');
var directory2 = path.join(rootDirectory, 'directory2');

var directory1_1 = path.join(directory1, 'directory1_1');
var directory1_2 = path.join(directory1, 'directory1_2');

var directory1_2_1 = path.join(directory1_2, 'directory1_2_1');
var directory1_2_2 = path.join(directory1_2, 'directory1_2_2');

// mix of pre defined and random file names
var randomFilename1 = generateRandomFilename('bak');
var randomFile1 = path.join(rootDirectory, randomFilename1);
var randomFilename2 = generateRandomFilename('log');
var randomFile2 = path.join(rootDirectory, randomFilename2);
var randomFile3 = path.join(rootDirectory, generateRandomFilename('log'));

var randomFile2_1 = path.join(directory2, generateRandomFilename('bak'));

var randomFilename1_2_1_1 = generateRandomFilename('log');
var randomFile1_2_1_1 = path.join(directory1_2_1, randomFilename1_2_1_1);
var randomFile1_2_1_2 = path.join(directory1_2_1, generateRandomFilename('bak'));
var randomFilename1_2_1_3 = generateRandomFilename('bak');
var randomFile1_2_1_3 = path.join(directory1_2_1, randomFilename1_2_1_3);

function makeFile(file, callback) {
    fs.writeFile(file, '', function(err) {
        if (err)
            callback(err);
        else
            callback(null);
    })
}

function createFakeDirectoryTree(callback) {
    
    async.series(
        [
            function(callback) {mkdirp(directory1, callback);},
            function(callback) {mkdirp(directory2, callback);},
            
            function(callback) {mkdirp(directory1_1, callback);},
            function(callback) {mkdirp(directory1_2, callback);},
            
            function(callback) {mkdirp(directory1_2_1, callback);},
            function(callback) {mkdirp(directory1_2_2, callback);},
            
            function(callback) {makeFile(randomFile1, callback);},
            function(callback) {makeFile(randomFile2, callback);},
            function(callback) {makeFile(randomFile3, callback);},
            
            function(callback) {makeFile(randomFile2_1, callback);},
            
            function(callback) {makeFile(randomFile1_2_1_1, callback);},
            function(callback) {makeFile(randomFile1_2_1_2, callback);},
            function(callback) {makeFile(randomFile1_2_1_3, callback);}
        ],
        
        function(err) {
            if (err) {
                console.error(err);
            } else {
                callback();
            }
        }
    );
}

function destroyFakeDirectoryTree(callback) {
    rimraf(rootDirectory, callback);
}

module.exports = testCase({
    
    'TC 1: tests without real files': testCase({
        'loading findRemove function (require)': function(t) {
            findRemove = require('../find-remove.js').findRemove;

            t.ok(findRemove, 'findRemove is loaded.');
            t.done();
        },

        'loading removeAll function (require)': function(t) {
            removeAll = require('../find-remove.js').removeAll;

            t.ok(removeAll, 'removeAll is loaded.');
            t.done();
        },

        'removing non-existing directory': function(t) {
            var result, dir = generateRandomFilename();

            result = findRemove(dir);
            t.ok(result, [], 'findRemove() returned empty an array.');

            result = removeAll(dir);
            t.ok(result, [], 'removeAll() returned empty an array.');


            t.done();
        }
    }),

    'TC 2: tests with real files': testCase({
        setUp: function(callback) {
            createFakeDirectoryTree(callback);
        },
        tearDown: function(callback) {
            destroyFakeDirectoryTree(callback);
        },

        'removeAll(rootDirectory)': function(t) {
            removeAll(rootDirectory);

            var exists = fs.existsSync(rootDirectory);
            t.equal(exists, false, 'removeAll(rootDirectory) removed everything fine');

            t.done();
        },

        'removeAll(directory1_2_1)': function(t) {
            var result = removeAll(directory1_2_1);

            var exists1_2_1 = fs.existsSync(directory1_2_1);
            var exists1_1 = fs.existsSync(directory1_1);
            t.equal(exists1_2_1, false, 'removeAll(directory1_2_1) removed everything fine');
            t.equal(exists1_1, true, 'removeAll(directory1_2_1) did not remove exists1_1');

            t.ok(result[randomFile1_2_1_1], 'randomFile1_2_1_1 is in result');
            t.ok(result[randomFile1_2_1_2], 'randomFile1_2_1_2 is in result');
            t.ok(result[randomFile1_2_1_3], 'randomFile1_2_1_3 is in result');
            t.ok(result[directory1_2_1], 'directory1_2_1 is in result');

            t.done();
        },

        'removeAll(directory2)': function(t) {
            var result = removeAll(directory2);

            var exists2 = fs.existsSync(directory2);
            var exists1_2 = fs.existsSync(directory1_2);
            t.equal(exists2, false, 'removeAll(directory2) removed everything fine');
            t.equal(exists1_2, true, 'removeAll(directory2) did not remove directory1_2');

            t.ok(result[randomFile2_1], 'randomFile2_1 is in result');
            
            t.strictEqual(typeof result[randomFile1], 'undefined', 'randomFile1_2_1_2 is NOT in result');
            t.strictEqual(typeof result[randomFile1_2_1_3], 'undefined', 'randomFile1_2_1_3 is NOT in result');

            t.done();
        },

        'findRemove(all bak files from root)': function(t) {
            findRemove(rootDirectory, {extensions: '.bak'});

            var exists1 = fs.existsSync(randomFile1);
            var exists2_1 = fs.existsSync(randomFile2_1);
            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2);
            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3);           

            t.equal(exists1, false, 'findRemove(all bak files from root) removed randomFile1 fine');
            t.equal(exists2_1, false, 'findRemove(all bak files from root) removed exists2_1 fine');
            t.equal(exists1_2_1_2, false, 'findRemove(all bak files from root) removed exists1_2_1_2 fine');
            t.equal(exists1_2_1_3, false, 'findRemove(all bak files from root) removed exists1_2_1_3 fine');

            var exists3 = fs.existsSync(randomFile3);
            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1);
            var exists0 = fs.existsSync(rootDirectory);
            var exists1_2_1 = fs.existsSync(directory1_2_1);

            t.equal(exists3, true, 'findRemove(all bak files from root) did not remove log file exists3');
            t.equal(exists1_2_1_1, true, 'findRemove(all bak files from root) did not remove log file exists1_2_1_1');            
            t.equal(exists0, true, 'findRemove(all bak files from root) did not remove root directory');
            t.equal(exists1_2_1, true, 'findRemove(all bak files from root) did not remove directory directory1_2_1');

            t.done();
        },

        'findRemove(all log files from directory1_2_1)': function(t) {
            findRemove(directory1_2_1, {extensions: '.log'});

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1);
            t.equal(exists1_2_1_1, false, 'findRemove(all log files from directory1_2_1) removed randomFile1_2_1_1 fine');

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2);
            t.equal(exists1_2_1_2, true, 'findRemove(all log files from directory1_2_1) did not remove file randomFile1_2_1_2');

            var exists1_2_1 = fs.existsSync(directory1_2_1);
            t.equal(exists1_2_1, true, 'ffindRemove(all log files from directory1_2_1) did not remove directory directory1_2_1');            

            t.done();
        },

        'findRemove(all bak and log files from root)': function(t) {
            findRemove(rootDirectory, {extensions: ['.bak', '.log']});

            var exists1 = fs.existsSync(randomFile1);
            var exists2_1 = fs.existsSync(randomFile2_1);
            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2);
            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3);
            
            var exists2 = fs.existsSync(randomFile2);
            var exists3 = fs.existsSync(randomFile3);
            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1);

            t.equal(exists1, false, 'findRemove(all bak and log files from root) removed randomFile1 fine');
            t.equal(exists2_1, false, 'findRemove(all bak and log files from root) removed exists2_1 fine');
            t.equal(exists1_2_1_2, false, 'findRemove(all bak and log files from root) removed exists1_2_1_2 fine');
            t.equal(exists1_2_1_3, false, 'findRemove(all bak and log files from root) removed exists1_2_1_3 fine');

            t.equal(exists2, false, 'findRemove(all bak and log files from root) removed exists2 fine');
            t.equal(exists3, false, 'findRemove(all bak and log files from root) removed exists3 fine');
            t.equal(exists1_2_1_1, false, 'findRemove(all bak and log files from root) removed exists1_2_1_1 fine');

            var exists1_1 = fs.existsSync(directory1_1);
            t.equal(exists1_1, true, 'findRemove(all bak and log files from root) did not remove directory1_1');
            
            t.done();
        },

        'findRemove(filename randomFilename1_2_1_1 from directory1_2)': function(t) {
            findRemove(directory1_2, {files: randomFilename1_2_1_1});

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1);
            t.equal(exists1_2_1_1, false, 'findRemove(filename randomFilename1_2_1_1 from directory1_2) removed randomFile1_2_1_1 fine');

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2);
            t.equal(exists1_2_1_2, true, 'findRemove(filename randomFilename1_2_1_1 from directory1_2) did not remove randomFile1_2_1_2');

            var exists1_2 = fs.existsSync(directory1_2);
            t.equal(exists1_2, true, 'findRemove(filename randomFilename1_2_1_1 from directory1_2) did not remove directory1_2');

            t.done();
        },

        'findRemove(two files from root)': function(t) {
            findRemove(rootDirectory, {files: [randomFilename2, randomFilename1_2_1_3]});

            var exists2 = fs.existsSync(randomFile2);
            t.equal(exists2, false, 'findRemove(two files from root) removed randomFile2 fine');

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3);
            t.equal(exists1_2_1_3, false, 'findRemove(two files from root) removed randomFile1_2_1_3 fine');

            var exists1 = fs.existsSync(randomFile1);
            t.equal(exists1, true, 'findRemove(two files from root) did not remove randomFile1');

            var exists0 = fs.existsSync(rootDirectory);
            t.equal(exists0, true, 'findRemove(two files from root) did not remove root directory');

            t.done();
        },

        'findRemove(files set to *.*)': function(t) {
            findRemove(directory1_2_1, {files: '*.*'});

            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1);
            t.equal(exists1_2_1_1, false, 'findRemove(files set to *.*) removed randomFile1_2_1_1 fine');

            var exists1_2_1_2 = fs.existsSync(randomFile1_2_1_2);
            t.equal(exists1_2_1_2, false, 'findRemove(files set to *.*) removed randomFile1_2_1_2 fine');

            var exists1_2_1_3 = fs.existsSync(randomFile1_2_1_3);
            t.equal(exists1_2_1_3, false, 'findRemove(files set to *.*) removed randomFile1_2_1_3 fine');

            var exists1_2_1 = fs.existsSync(directory1_2_1);
            t.equal(exists1_2_1, true, 'findRemove(files set to *.*did not remove directory1_2_1');

            t.done();
        },

        'findRemove(with mixed ext and file params)': function(t) {
            var result = findRemove(rootDirectory, {files: randomFilename1, extensions: ['.log']});

            var exists1 = fs.existsSync(randomFile1);
            var exists2 = fs.existsSync(randomFile2);
            var exists1_2_1_1 = fs.existsSync(randomFile1_2_1_1);
            t.equal(exists1, false, 'findRemove(with mixed ext and file params) removed randomFile1 fine');
            t.equal(exists2, false, 'findRemove(with mixed ext and file params) removed randomFile2 fine');
            t.equal(exists1_2_1_1, false, 'findRemove(with mixed ext and file params) removed randomFile1_2_1_1 fine');

            var exists1_2_1 = fs.existsSync(directory1_2_1);
            t.equal(exists1_2_1, true, 'findRemove(two files from root) did not remove directory1_2_1');

            t.strictEqual(typeof result[randomFile1], 'boolean', 'randomFile1 in result is boolean');
            t.strictEqual(typeof result[randomFile1_2_1_2], 'undefined', 'randomFile1_2_1_2 is NOT in result');

            t.done();
        }
    })   
});
