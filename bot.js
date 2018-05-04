const Telegraf = require('telegraf');
const request = require('request');
const crypto = require('crypto');
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

const md5sum = crypto.createHash('md5');

const getBiblio = function (callback) {
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
        callback(message);
    });
}

bot.on('text', ctx =>{
    getBiblio(res => ctx.replyWithMarkdown(res));
});

// bot.command('biblio', ctx => {
//     getBiblio(res => ctx.replyWithMarkdown(res));
// });

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
    getBiblio(res => {
        md5sum.update(res);
        let result = {
            type: 'article',
            id: md5sum.digest('hex'),
            title: "Orari di oggi",
            description : res,
            input_message_content: {
                message_text: res,
                parse_mode: 'Markdown'
            }
        }
        return answerInlineQuery([result])
    })
});

bot.startPolling();