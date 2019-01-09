# bibliotrentobot
[![](https://images.microbadger.com/badges/version/albertoxamin/bibliotrentobot.svg)](https://microbadger.com/images/albertoxamin/bibliotrentobot)
[![](https://images.microbadger.com/badges/image/albertoxamin/bibliotrentobot.svg)](https://microbadger.com/images/albertoxamin/bibliotrentobot)
[![Docker Build Status](https://img.shields.io/docker/build/albertoxamin/bibliotrentobot.svg)](https://hub.docker.com/r/albertoxamin/bibliotrentobot/)
[![Docker Pulls](https://img.shields.io/docker/pulls/albertoxamin/bibliotrentobot.svg)](https://hub.docker.com/r/albertoxamin/bibliotrentobot/)
[![CodeFactor](https://www.codefactor.io/repository/github/albertoxamin/bibliotrentobot/badge)](https://www.codefactor.io/repository/github/albertoxamin/bibliotrentobot)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Falbertoxamin%2Fbibliotrentobot.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Falbertoxamin%2Fbibliotrentobot?ref=badge_shield)

## What is this repository about?
This project is a Node.js Telegraf (Telegram) bot to {}.

This is the code powering @bibliotrentobot.

## Set-up
Once you cloned the repository:
you need to enter into project dir: `cd bibliotrentobot`
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
docker run -it -e "token=YOUR_TELEGRAM_API_KEY" \
	-v storage_path:/usr/src/app/storage \
    --name bibliotrentobot albertoxamin/bibliotrentobot
```

where `storage_path` is something like this `~/biblio` and inside that folder add a `db.json`


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Falbertoxamin%2Fbibliotrentobot.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Falbertoxamin%2Fbibliotrentobot?ref=badge_large)