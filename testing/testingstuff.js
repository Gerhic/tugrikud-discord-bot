// var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// var logger = require('winston');

// // Configure logger settings
// logger.remove(logger.transports.Console);
// logger.add(new logger.transports.Console, {
//     colorize: true
// });
// logger.level = 'debug';

// var HttpClient = function () {
//     this.get = function (aUrl, aCallback) {
//         var anHttpRequest = new XMLHttpRequest();
//         anHttpRequest.onreadystatechange = function () {
//             if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
//                 aCallback(anHttpRequest.responseText);
//         }

//         anHttpRequest.open("GET", aUrl, true);
//         anHttpRequest.send(null);
//     }
// }

// var client = new HttpClient();
// client.get('http://lorien.ee/tugrikud', function (response) {
//     logger.info('response: ' + response);
//     // do something with response
// });

// logger.info('test');


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const https = require('https');

https.get('https://lorien.ee/tugrikud', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        console.log(data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});