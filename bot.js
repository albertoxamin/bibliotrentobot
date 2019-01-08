const Telegraf = require('telegraf')
const LocalSession = require('telegraf-session-local')
const request = require('request')
const crypto = require('crypto')
const moment = require('moment')
var config
try { config = require('./config') } catch (err) {
	config = {
		token: process.env.token
	}
}

const bot = new Telegraf(config.token)

const localSession = new LocalSession({
	database: './storage/db.json',
	property: 'session',
	storage: LocalSession.storageFileAsync,
	format: {
		serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
		deserialize: (str) => JSON.parse(str),
	}
})

bot.use(localSession.middleware('session'))

bot.telegram.getMe().then((bot_informations) => {
	bot.options.username = bot_informations.username
	console.log('Server has initialized bot nickname. Nick: ' + bot_informations.username)
})

bot.command(['help', 'start'], ctx => {
	ctx.replyWithMarkdown(
		'Benvenuto a bibliotrentobot.\n' +
		'Questo bot ti permette di consultare gli orari delle biblioteche universitarie di Trento\n\n' +
		'Scrivimi qualsiasi cosa e ti risponderò con gli orari di **oggi**\n\n' +
		'In caso di problemi con il bot contattate @albertoxamin\n\n' +
		'Contribuisci allo sviluppo su https://github.com/albertoxamin/bibliotrentobot\n' +
		'Oppure puoi offrirmi un caffè http://buymeacoff.ee/Xamin')
})

bot.command('/stats', ctx => {
	ctx['session'].usage = ctx['session'].usage || 0
	ctx['session'].usage++
	totalUsage = 0, totalUsers = localSession.DB.value().sessions.length
	localSession.DB.value().sessions.forEach(session => {
		totalUsage += session.data.usage
	})
	ctx.replyWithMarkdown(`Il bot ha \`${totalUsers}\` utenti, e ha informato \`${totalUsage}\` volte gli orari delle biblioteche`)
})

var lastUnix = ''
var cachedMessage = ''

const getBiblio = function (callback) {
	let m = moment().utcOffset(0)
	m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
	let todayUnix = m.unix().toString() + '000'
	if (todayUnix != lastUnix) {
		lastUnix = lastUnix
		request('http://spotted-biblio.herokuapp.com/raw', (err, response, body) => {
			if (err || response.statusCode != 200)
				return 'Errore di connessione'
			body = JSON.parse(body)
			delete (body.lastUpdate)
			let message = ''
			for (let property in body) {
				if (body.hasOwnProperty(property)) {
					message += `*${property}* \n\t🔓 \`${body[property].open}\` 🔐 \`${body[property].close}\`\n`
				}
			}
			cachedMessage = message
			callback(message)
		})
	} else {
		callback(cachedMessage)
	}
}

bot.on('text', ctx => {
	ctx['session'].usage = ctx['session'].usage || 0
	ctx['session'].usage++
	getBiblio(res => ctx.replyWithMarkdown(res))
})

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
	console.log(inlineQuery)
	getBiblio(res => {
		let result = {
			type: 'article',
			id: crypto.createHash('md5').update(res).digest('hex'),
			title: 'Orari di oggi',
			description: res,
			input_message_content: {
				message_text: res,
				parse_mode: 'Markdown'
			}
		}
		return answerInlineQuery([result])
	})
})

bot.catch((err) => {
	console.log('Ooops', err)
})

bot.startPolling()