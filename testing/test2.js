var httpRequest = require("xmlhttprequest")
var name1 = 'sixten';
var name2 = 'leemets';
// var exp = '(leemets,sixten)'
// var exp = '(leemets,sixten).*?danger\"\>(.*?)\<'
var exp = '(' + name2 + ',' + name1 + '|' + name1 + ',' + name2 + ').*?danger">(.*?)<\/span>'

function readTextFile(file) {
    var rawFile = new httpRequest.XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            var allText = rawFile.responseText;
            doStuff(allText);
        }
    }
    rawFile.send(null);
}

function getCurrentDirectory() {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var path = fso.GetAbsolutePathName(".");

    fso = null;

    return path;
}

readTextFile("file://C:/Users/SLeem/Desktop/dscbt/src.txt"); // WARN: path


function doStuff(src) {
    console.log("starting to search ");
    src = src.replace(/(?:\r\n|\r|\n|\s)/g, '');

    var myRe = new RegExp(exp, 'gi');
    var myArray = myRe.exec(src);

    console.log(myArray[2]);
}