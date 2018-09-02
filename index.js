const config = require('./config.json');
const Discord = require('discord.js');
const util = require('util');
const fs = require('fs');
const schedule = require('node-schedule')

var XMLHttpRequest = require("xmlhttprequest");
const bot = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ['TYPING_START']
});

var regUsers = {};
var dataDict;
const dataFileName = "data.json";

var HttpClient = function () {
    this.get = function (aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest.XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
            console.log(anHttpRequest.readyState + ' ' + anHttpRequest.status);

            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
    }
};

bot.on("ready", () => {
    bot.user.setActivity('MTG'); //you can set a default game
    console.log(`Bot is online!\n${bot.users.size} users, in ${bot.guilds.size} servers connected.`);
});

bot.on("guildCreate", guild => {
    console.log(`I've joined the guild ${guild.name} (${guild.id}), owned by ${guild.owner.user.username} (${guild.owner.user.id}).`);
});

bot.on("message", async message => {

    if (message.author.bot || message.system) return; // Ignore bots

    if (message.channel.type === 'dm') { // Direct Message
        let msg = message.content.slice(config.prefix.length); // slice of the prefix on the message
        msg = msg.toLowerCase();

        let args = msg.split(" "); // break the message into part by spaces
        let cmd = args[0].toLowerCase(); // set the first word as the command in lowercase just in case

        args.shift(); // delete the first word from the args

        if (cmd === 'reg' || cmd === 'register') { // register user
            let userId = message.author.id;

            regUsers[userId] = {};
            regUsers[userId].lastName = args[args.length - 1];
            args.splice(-1, 1);
            regUsers[userId].firstName = args.join(" ");

            writeRegUsersToDisk();

            message.channel.send('I will PM you when balance changes for ' + regUsers[userId].firstName + " " + regUsers[userId].lastName);

            // check prev cached data to see if balance available

            checkAllBalance();

            return;
        }

        else if (cmd === 'refresh') {
            checkAllBalance();
        }

        return; //Optionally handle direct messages
    }

    console.log(message.content); // Log chat to console for debugging/testing

    if (message.content.indexOf(config.prefix) === 0) { // Message starts with your prefix

        let msg = message.content.slice(config.prefix.length); // slice of the prefix on the message
        msg = msg.toLowerCase();

        let args = msg.split(" "); // break the message into part by spaces

        let cmd = args[0].toLowerCase(); // set the first word as the command in lowercase just in case

        args.shift(); // delete the first word from the args


        if (cmd === 'hi' || cmd === 'hello') { // the first command [I don't like ping > pong]
            message.channel.send(`Hi there ${message.author.toString()}`);
            return;
        }

        else if (cmd === 'ping') { // ping > pong just in case..
            return message.channel.send('pong');
        }

        // Make sure this command always checks for you. YOU NEVER WANT ANYONE ELSE TO USE THIS COMMAND
        else if (cmd === "eval" && message.author.id === config.owner) { // < checks the message author's id to yours in config.json.
            const code = args.join(" ");
            return evalCmd(message, code);
        }

        else if (cmd === "refresh") {
            message.channel.send(`Refreshing balances`);
            checkAllBalance();
        }

        else if (cmd === 'reg' || cmd === 'register') { // register user
            let userId = message.author.id;

            if (args.length < 2) {
                message.channel.send('<@' + message.author.id + '> type !reg firstname lastname');
                return;
            }

            regUsers[userId] = {};
            regUsers[userId].lastName = args[args.length - 1];
            args.splice(-1, 1);
            regUsers[userId].firstName = args.join(" ");

            writeRegUsersToDisk();

            message.channel.send('I will PM you when balance changes for ' + regUsers[userId].firstName + " " + regUsers[userId].lastName + ' <@' + message.author.id + '>');

            checkAllBalance();

            return;
        }

        else { // if the command doesn't match anything you can say something or just ignore it
            message.channel.send('<@' + message.author.id + '> type !reg firstname lastname');
            return;
        }

    } else if (message.content.indexOf("<@" + bot.user.id) === 0 || message.content.indexOf("<@!" + bot.user.id) === 0) { // Catch @Mentions

        return message.channel.send(`Use \`${config.prefix}\` to interact with me.`); //help people learn your prefix
    }
    return;
});

function evalCmd(message, code) {
    if (message.author.id !== config.owner) return;
    try {
        let evaled = eval(code);
        if (typeof evaled !== "string")
            evaled = util.inspect(evaled);
        message.channel.send(clean(evaled), { code: "xl" });
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
}
function clean(text) {
    if (typeof (text) !== 'string') {
        text = util.inspect(text, { depth: 0 });
    }
    text = text
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203))
        .replace(config.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0') //Don't let it post your token
    return text;
}
function checkAllBalance() {
    var client = new HttpClient();
    client.get('https://www.lorien.ee/tugrikud/', function (response) {
        if (response) {
            let src = response.replace(/(?:\r\n|\r|\n|\s)/g, '').toLowerCase();

            dataDict = parseSource(src);
            onNewData();
        }
    });

}
function parseSource(src) {
    let exp = '<td>(.*?)<\/td>.*?<span.*?">(.*?)<\/span>'
    var re = new RegExp(exp, 'gi');
    var m;
    var dict = {};

    while (m = re.exec(src)) {
        var key = m[1];

        dict[key] = {};
        dict[key].bal = parseFloat(m[2]);
    }

    console.log(dict);
    return dict;
}
function onNewData() {
    for (var client in regUsers) {
        var val = regUsers[client];

        for (var fullName in dataDict) {
            if (fullName.includes(val.firstName) && fullName.includes(val.lastName)) {
                var prevBal = val.bal;
                val.bal = dataDict[fullName].bal;

                if (prevBal) {
                    if (prevBal != val.bal) {
                        bot.users.get(client).send('Your balance has changed by ' + (prevBal - val.bal.toFixed(2)) + ' and is ' + val.bal.toFixed(2) + '€')
                    }
                } else {
                    bot.users.get(client).send('Your balance is ' + val.bal.toFixed(2) + '€')
                }
            }
        }
    }
}
function writeRegUsersToDisk() {
    fs.writeFile(dataFileName, JSON.stringify(regUsers));
}
function readRegUsersFromDisk() {
    try {
        let file = fs.readFileSync(dataFileName, 'utf8')

        if (file) {
            regUsers = JSON.parse(file);
        }
    } catch (err) {

    }
}

// Catch Errors before they crash the app.
process.on('uncaughtException', (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
    console.error('Uncaught Exception: ', errorMsg);
    // process.exit(1); //Eh, should be fine, but maybe handle this?
});

process.on('unhandledRejection', err => {
    console.error('Uncaught Promise Error: ', err);
    // process.exit(1); //Eh, should be fine, but maybe handle this?
});

bot.login(config.token);
readRegUsersFromDisk();

schedule.scheduleJob('0 0 23 * *', () => { 
    checkAllBalance();
})
