// Require the necessary discord.js classes

const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, prefix, id_guild, bot_channel } = require('../resources/config.json');
//1016321742362378292
//1019995913655173293
const url_menu = "https://lycee-elie-vinet.fr/pdf_lycee/menu.pdf";
const destination_path = "../resources/";

let isSendingMenu = false;

// Create a new client instance
const client = new Client({ intents: [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
  if (!isSendingMenu) sendMenu();
});

client.on("messageCreate", (message)  => {
  const elements = extractElements(message.content);

  if (prefix !== elements.local_prefix) return

  console.log("Commande:", elements.local_command);
  if (elements.local_message) {
    console.log("Texte:", elements.local_message);
  }

  switch (elements.local_command) {
    case "menu":
      message.channel.send("Téléchargement en cours, veuillez patienter. Temps d'attente estimé, 30 secondes.")
      let date = new Date();
      let monday = new Date(date.setDate(date.getDate()-date.getDay()+1)).toLocaleDateString();
      let friday = new Date(date.setDate(date.getDate()-date.getDay()+5)).toLocaleDateString();
      let sunday = new Date(date.setDate(date.getDate()-date.getDay()+7)).toLocaleDateString();

      message.channel.send({
        files: [{
            attachment: url_menu,
            name: 'NotaVirus.exe'
        }],
        content:'Pour le Lundi ' + monday + ' au Vendredi ' + friday,
      });
      break;
      case "where":
        message.channel.send("URL : " + url_menu);
        break;

        case "when":
          message.channel.send("En cours d'envoie : " + isSendingMenu + " le " + sunday + " à 23h50.");
          break;
        case "tony":
          message.channel.send("Roi des rats :crown:");
          break;
    default:
      break;
  }


  if (message.mentions.users.has(client.user.id)) {
    message.reply("Hey!")
  } 
})

function sendMenu() {
  const channel = client.guilds.cache.get(id_guild).channels.cache.get(bot_channel);

  if (!channel) {
    console.error(`Le canal avec l'ID ${bot_channel} n'a pas été trouvé.`);
    return;
  }

  const now = new Date();
  const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 5, 0);
  isSendingMenu = true;
  if (now >= targetTime) {
    console.log("Envoie fichier...");
    let date = new Date();
    let monday = new Date(date.setDate(date.getDate()-date.getDay()+1)).toLocaleDateString();
    let friday = new Date(date.setDate(date.getDate()-date.getDay()+5)).toLocaleDateString();
    channel.send({
      files: [{
          attachment: url_menu,
          name: 'NotaVirus.exe'
      }],
      content:'Pour le Lundi ' + monday + ' au Vendredi ' + friday,
    }).then(() => {
      console.log("Fichier envoyé, timer de 7 jour lancé");
      setTimeout(sendMenu, 7 * 24 * 60 * 60 * 1000); // Attendre 7 jours avant de recommencer
    });
  }
}

function extractElements(message) {
  if (!message.startsWith(prefix)) {
    const local_prefix = '';
    const local_command = '';
    const local_message = message;
    return {
      local_prefix,
      local_command,
      local_message
    };
  }
    
  const local_prefix = message.slice(0, prefix.length);
  
  const local_rawMessage = message.slice(prefix.length);
  const local_command = local_rawMessage.split(" ")[0].toLowerCase();
  const local_message = local_rawMessage.slice(local_command.length);
  
  return {
    local_prefix,
    local_command,
    local_message
  };
}

client.login(token);