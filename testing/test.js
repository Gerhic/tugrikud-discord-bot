var XMLHttpRequest = require("xmlhttprequest");

var logger = require('winston');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var HttpClient = function () {
    this.get = function (aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest.XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
            logger.info(anHttpRequest.readyState + ' ' + anHttpRequest.status);

            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
    }
}
logger.info('starting')

var client = new HttpClient();
client.get('https://www.lorien.ee/tugrikud/', function (response) {
    logger.info('response: ' + response)

    // do something with response
});

