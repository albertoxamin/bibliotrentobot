const Telegraf = require('telegraf')
var { Telegram, Markup } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const request = require('request')
const schedule = require('node-schedule')
const crypto = require('crypto')
const moment = require('moment')
const strip = require('striptags')
var config
try { config = require('./config') } catch (err) {
	config = {
		token: process.env.token
	}
}

const telegram = new Telegram(config.token, null)
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
		'Comandi aggiuntivi /stats /notifiche /gdpr\n' +
		'In caso di problemi con il bot contattate @albertoxamin\n\n' +
		'Contribuisci allo sviluppo su https://github.com/albertoxamin/bibliotrentobot\n' +
		'Oppure puoi offrirmi un caffè http://buymeacoff.ee/Xamin')
})

const notificationKeyboard = (nots) => {
	return Markup.inlineKeyboard([
		[Markup.callbackButton(`Notifiche ${(nots.status == true ? 'attive 🔔' : 'disattivate 🔕')}`, 'not_status')],
		[5, 6, 7, 8, 9].map(h => Markup.callbackButton(`${h} ${(nots.hour == h ? '✅' : '')}`, 'not_h_' + h))

	]).extra()
}

bot.command('notifiche', ctx => {
	let nots = ctx.session.notifiche || { status: true, hour: 7 }
	return ctx.replyWithMarkdown('Impostazioni di notifica', notificationKeyboard(nots))
})

bot.on('callback_query', (ctx) => {
	let nots = ctx.session.notifiche || { status: true, hour: 7 }
	let data = ctx.callbackQuery.data
	if (data.indexOf('not_') != -1) {
		if (data.indexOf('status') != -1) nots.status = !nots.status
		else if (data.indexOf('h') != -1) nots.hour = Number(data.slice(-1))
		ctx.session.notifiche = nots
		telegram.editMessageText(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id, null, 'Impostazioni di notifica', notificationKeyboard(nots))
		ctx.answerCbQuery('Impostazioni salvate!')
	} else if (data.indexOf('delete') != -1) {
		ctx.session = null
		ctx.answerCbQuery('I tuoi dati sono stati eliminati!')
	} else if (data.indexOf('date_') != -1) {
		let buttons = [1, 2, 3, 4, 5].filter(x => Number(data.slice(-1) != x)).map(x =>
			Markup.callbackButton(moment().add(x, 'days').format("DD/MM"), 'date_' + x))
		if (data != 'date_0')
			buttons.unshift(Markup.callbackButton(moment().format("DD/MM"), 'date_0'))
		let kb = Markup.inlineKeyboard(buttons).extra()
		kb.parse_mode = 'Markdown'
		getBiblio(res => {
				telegram.editMessageText(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id, null, res, kb)
				ctx.answerCbQuery('Orario aggiornato!')
			},
			moment().add(Number(data.slice(-1)), 'days').format("YYYY-MM-DD"))
	}
})

bot.command('gdpr', ctx => {
	ctx.replyWithChatAction('typing')
	ctx.reply(`Ecco i tuoi dati:\n${JSON.stringify(ctx.session, null, 2)}`,
		Markup.inlineKeyboard([Markup.callbackButton('Elimina i miei dati 🗑', 'delete')]).extra())
})

bot.command('stats', ctx => {
	ctx.session.usage = ctx.session.usage || 0
	ctx.session.usage++
	totalUsage = 0, totalUsers = localSession.DB.value().sessions.length
	localSession.DB.value().sessions.forEach(session => {
		if (session.data && session.data.usage)
			totalUsage += session.data.usage
	})
	ctx.replyWithMarkdown(`Il bot ha \`${totalUsers}\` utenti, e ha informato \`${totalUsage}\` volte gli orari delle biblioteche`)
})

bot.command('notsay', ctx => {
	if (ctx.message.chat.username == 'albertoxamin') {
		var msg = ctx.message.text.toString()
		localSession.DB.value().sessions.forEach(session => {
			if (session.data.notifiche && session.data.notifiche.status)
				telegram.sendMessage(session.id, msg.replace('/notsay', ''), Object.assign({ 'parse_mode': 'Markdown' }))
		})
	}
})

bot.command('say', ctx => {
	if (ctx.message.chat.username == 'albertoxamin') {
		var msg = ctx.message.text.toString()
		localSession.DB.value().sessions.forEach(session => {
			telegram.sendMessage(session.id, msg.replace('/say', ''), Object.assign({ 'parse_mode': 'Markdown' }))
		})
	}
})

var lastUnix = ''
var cachedMessage = ''

const getBiblio = function (callback, date) {
	let m = moment().utcOffset(0)
	m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
	let todayUnix = m.unix().toString() + '000'
	if (todayUnix != lastUnix || date != undefined) {
		lastUnix = lastUnix
		request(`https://www.biblioteca.unitn.it/orarihp${(date) ? `?data=${date}&` : '?'}lingua=it`, (err, response, body) => {
			if (err || response.statusCode != 200)
				return callback('Non sono riuscito a connettermi a unitn.it!')
			body = (strip(body, [], '%'))
			body = body.replace(/%+/g, '+')
			let studyRooms = body.split('+')
			delete (body.lastUpdate)
			let message = `${studyRooms[2]}\n`
			for (let i = 4; i < 14; i += 2) {
				if (studyRooms.length >= i) {
					let times = studyRooms[i + 1].split('-')
					if (times.length >= 2)
						message += `*${studyRooms[i]}* \n\t🔓 \`${times[0]}\` 🔐 \`${times[1]}\`\n`
					else message += `*${studyRooms[i]}* \n\t🔐 \`${studyRooms[i + 1]}\`\n`
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
	ctx.replyWithChatAction('typing')
	ctx.session.usage = ctx.session.usage || 0
	ctx.session.usage++
	getBiblio(res => ctx.replyWithMarkdown(res,
		Markup.inlineKeyboard([
			[1, 2, 3, 4, 5].map(x => Markup.callbackButton(moment().add(x, 'days').format("DD/MM"), 'date_' + x))
		]).extra()))
})

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
	let ses = localSession.DB.get('sessions').getById(`${inlineQuery.from.id}:${inlineQuery.from.id}`).value()
	ses.usage = ses.usage || 0
	ses.usage++
	let date = moment().add(1, 'days').format("YYYY-MM-DD")
	getBiblio(today => getBiblio(tomorrow => {
		let result = [
			{
				type: 'article',
				id: crypto.createHash('md5').update(today).digest('hex'),
				title: 'Orari di oggi',
				description: today,
				input_message_content: {
					message_text: today,
					parse_mode: 'Markdown'
				}
			}, {
				type: 'article',
				id: crypto.createHash('md5').update('tm_' + tomorrow).digest('hex'),
				title: 'Orari di domani',
				description: tomorrow,
				input_message_content: {
					message_text: tomorrow,
					parse_mode: 'Markdown'
				}
			}
		]
		return answerInlineQuery(result)
	}, date))
})

var notifiche = schedule.scheduleJob('0 * * * *', (date) => {
	localSession.DB.value().sessions.forEach(session => {
		if (session.data.notifiche && session.data.notifiche.status && session.data.notifiche.hour == date.getHours()) {
			session.data.usage++
			localSession.DB.updateById(session.id, session.data)
			getBiblio(res => telegram.sendMessage(session.id, res, Object.assign({ 'parse_mode': 'Markdown' })))
		}
	})
})

bot.catch((err) => {
	console.log('Ooops', err)
})

bot.startPolling()
