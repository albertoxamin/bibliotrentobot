const Telegraf = require('telegraf');
const request = require('request');
const crypto = require('crypto');
const moment = require('moment');
var config;
try { config = require('./config') } catch (err) {
    config = {
        token: process.env.token
    }
}

const bot = new Telegraf(config.token);

bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: " + bot_informations.username);
});

bot.command(['help', 'start'], ctx => {
    ctx.replyWithMarkdown('Benvenuto a bibliotrentobot.\nQuesto bot ti permette di consultare gli orari delle biblioteche universitarie di Trento\n\nScrivimi qualsiasi cosa e ti risponderò con gli orari di **oggi**\n\nIn caso di problemi con il bot contattate @albertoxamin\n\nContribuisci allo sviluppo su https://github.com/albertoxamin/bibliotrentobot\nOppure puoi offrirmi un caffè http://buymeacoff.ee/Xamin');
});

var lastUnix = "";
var cachedMessage = "";

const getBiblio = function (callback) {
    let m = moment().utcOffset(0);
    m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    let todayUnix = m.unix().toString() + "000";
    if (todayUnix != lastUnix) {
        lastUnix = lastUnix;
        request('http://spotted-biblio.herokuapp.com/raw', (err, response, body) => {
            if (err || response.statusCode != 200)
                return "Errore di connessione";
            body = JSON.parse(body);
            delete (body.lastUpdate);
            let message = "";
            for (let property in body) {
                if (body.hasOwnProperty(property)) {
                    message += `*${property}* \n\t🔓 \`${body[property].open}\` 🔐 \`${body[property].close}\`\n`;
                }
            }
            cachedMessage = message;
            callback(message);
        });
    } else {
        callback(cachedMessage);
    }
}

bot.on('text', ctx => {
    getBiblio(res => ctx.replyWithMarkdown(res));
});

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
    getBiblio(res => {
        let result = {
            type: 'article',
            id: crypto.createHash('md5').update(res).digest('hex'),
            title: "Orari di oggi",
            description: res,
            input_message_content: {
                message_text: res,
                parse_mode: 'Markdown'
            }
        }
        return answerInlineQuery([result])
    })
});

bot.catch((err) => {
    console.log('Ooops', err);
});

bot.startPolling();