# bibliotrentobot
[![](https://images.microbadger.com/badges/version/albertoxamin/{}.svg)](https://microbadger.com/images/albertoxamin/{})
[![](https://images.microbadger.com/badges/image/albertoxamin/{}.svg)](https://microbadger.com/images/albertoxamin/{})

## What is this repository about?
This project is a Node.js Telegraf (Telegram) bot to {}.

This is the code powering @{}.

## Set-up
Once you cloned the repository:
you need to enter into project dir: `cd {}`
and type `npm install` to install all dependencies.

Create a `config.js` file in the root of this project with the following info:
```javascript
module.exports = {
    // API key for Telegram
    token:'YOUR_TELEGRAM_API_KEY'
};
```
For Telegram API key, check https://github.com/Finalgalaxy/telegram-telegraf-bot and follow README instructions about how to create a Telegram Bot.

Once you've set up your API key, just type:
`npm start`
...done!

## Docker
For easier deployment you can also use the docker image

```shell
docker pull albertoxamin/bibliotrentobot
docker run -it -e "TOKEN=YOUR_TELEGRAM_API_KEY" \
    --name bibliotrentobot albertoxamin/bibliotrentobot
```
