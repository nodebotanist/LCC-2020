const dotenv = require('dotenv').config()
const tmi= require('tmi.js')
const color = require('color')
const redis = require('redis')

const twitchIRC = process.env.TWITCH_IRC_ROOM
const commandPrefix = '!'

// Define configuration options:
let opts = {
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: 'oauth:' + process.env.TWITCH_IRC_PASSWORD
  },
  channels: [
    twitchIRC
  ]
}

// Create a client with our options:
let client = new tmi.client(opts)

let db = redis.createClient()

client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)
client.on('disconnected', onDisconnectedHandler)

// Connect to Twitch:
client.connect()

let knownCommands = {
  'hello': (target, context, params) => {
    client.action(twitchIRC, "Hi!");
  },
  'color': (target, context, params) => {
    let colorParam = params.join(' ').toLowerCase();
    let lightColor = null
    try {
      lightColor = color(colorParam)
    } catch (error) {}
    if(lightColor){
      let result = {
        r:lightColor.red(),
        g:lightColor.green(),
        b:lightColor.blue()
      }
      client.action(twitchIRC, `Color R:${lightColor.color[0]} G:${lightColor.color[1]} B:${lightColor.color[2]}!`)
      addColorToDB(result)
    } else {
      client.action(twitchIRC, 'Invalid color!')
    }
  }
}

let randomcolors = ['rebeccapurple', 'blue', 'purple', 'orange', 'green', 'red']
let randomIndex = 0

setInterval(()=>{
  randomIndex = Math.floor((Math.random() * randomcolors.length))
  let lightColor = color(randomcolors[randomIndex])
  let result = {
    r:lightColor.red(),
    g:lightColor.green(),
    b:lightColor.blue()
  }
  addColorToDB(result)
  client.action(twitchIRC, `Random Color R:${lightColor.color[0]} G:${lightColor.color[1]} B:${lightColor.color[2]}!`)
}, 60000)

async function addColorToDB(color) {
  let dbField = 'colorQueue'
  db.get(dbField, (err, value) => {
    let colorQueue = JSON.parse(value)
    colorQueue.push(color)
    if(colorQueue.length > 256){
      colorQueue = colorQueue.slice(1, 256)
    }
    db.set(dbField, JSON.stringify(colorQueue))
  })
}

// Called every time a message comes in:
function onMessageHandler (target, context, msg, self) {
  if (self) { return } // Ignore messages from the bot

  // This isn't a command since it has no prefix:
  if (msg.substr(0, 1) !== commandPrefix) {
    console.log(`[${target} (${context['message-type']})] ${context.username}: ${msg}`)
    return
  }

  // Split the message into individual words:
  const parse = msg.slice(1).split(' ')
  // The command name is the first (0th) one:
  const commandName = parse[0]
  // The rest (if any) are the parameters:
  const params = parse.splice(1)

  // If the command is known, let's execute it:
  if (commandName in knownCommands) {
    // Retrieve the function by its name:
    const command = knownCommands[commandName]
    // Then call the command with parameters:
    command(target, context, params)
    console.log(`* Executed ${commandName} command for ${context.username}`)
  } else {
    console.log(`* Unknown command ${commandName} from ${context.username}`)
  }
}

// Called every time the bot connects to Twitch chat:
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`)
}

// Called every time the bot disconnects from Twitch:
function onDisconnectedHandler (reason) {
  console.log(`Womp womp, disconnected: ${reason}`)
  process.exit(1)
}