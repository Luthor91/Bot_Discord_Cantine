const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, prefix, id_guild, bot_channel, id_guild_owner, bot_channel_owner } = require('../resources/config.json');
const { Modal, TextInputComponent, SelectMenuComponent, showModal, discordModals } = require('discord-modals');

const domtoimage = require('dom-to-image');
const axios = require('axios');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');

const url_site = "https://lycee-elie-vinet.fr/pdf_lycee/menu.pdf";
const url_menu = "../resources/menu.png";
const url_pdf = "../resources/menu.pdf";


let isSendingMenu = false;

// Create a new client instance
const client = new Client({ intents: [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent] });

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
  let date = new Date();
  let monday = new Date(date.setDate(date.getDate()-date.getDay()+1)).toLocaleDateString();
  let friday = new Date(date.setDate(date.getDate()-date.getDay()+5)).toLocaleDateString();
  let sunday = new Date(date.setDate(date.getDate()-date.getDay()+7)).toLocaleDateString();
  switch (elements.local_command) {
    
    case "menu":
      async() => {
        await captureWebpage()
          .then(() => console.log('Tâche terminée avec succès'))
          .catch(error => console.error('Une erreur s\'est produite :', error));
      }

      break;
      case "where":
        message.channel.send("URL : " + url_site);
        break;
        case "when":
          message.channel.send("En cours d'envoie : " + isSendingMenu + " le " + sunday + " à 23h50.");
          break;
          case "pdf":
            message.channel.send("Téléchargement en cours, veuillez patienter. Temps d'attente estimé, 30 secondes.")
            message.channel.send({
              files: [{
                  attachment: url_menu,
                  name: 'NotaVirus.exe.pdf.txt.png'
              }],
              content:'Pour le Lundi ' + monday + ' au Vendredi ' + friday,
            });
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

async function sendMenu() {
  const channel = client.guilds.cache.get(id_guild_owner).channels.cache.get(bot_channel_owner);

  if (!channel) {
    console.error(`Le canal avec l'ID ${bot_channel_owner} n'a pas été trouvé.`);
    return;
  }

  const now = new Date();
  // Pour l'envoyer tous les dimanche
  let sunday = new Date(now.setDate(now.getDate()-now.getDay()+7)).toLocaleDateString();
  // Date normale : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0);
  const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  console.log("target : " + targetTime);
  console.log("now : " + now);
  isSendingMenu = true;
  if (now >= targetTime) {
    console.log("Envoie fichier...");
    let date = new Date();
    let monday = new Date(date.setDate(date.getDate()-date.getDay()+1)).toLocaleDateString();
    let friday = new Date(date.setDate(date.getDate()-date.getDay()+5)).toLocaleDateString();
    try {
      await captureWebpage()
        .then(() => console.log('Tâche terminée avec succès'))
        .catch(error => console.error('Une erreur s\'est produite :', error));
      channel.send({
        files: [{
            attachment: url_menu,
            name: 'NotaVirus.exe.pdf.txt.png'
        }],
        content:'Pour le Lundi ' + monday + ' au Vendredi ' + friday,
      }).then(() => {
        console.log("Fichier envoyé, timer de 7 jour lancé");
        setTimeout(sendMenu, 7 * 24 * 60 * 60 * 1000); // Attendre 7 jours avant de recommencer
      });

    } catch (error) {
      console.error('Une erreur s\'est produite :', error);
    }

  } else {
    // On revérifie dans 10 minutes
    setTimeout(sendMenu, 10 * 60 * 1000);
  }
}

async function isUrlAccessible(url) {
  const response = await fetch(url, { method: 'HEAD' });
  return response.ok;
}

async function downloadPdf(url, outputDir, outputFileName) {
  const response = await axios.get(url, { responseType: 'stream' });
  const outputPath = path.join(outputDir, outputFileName);

  response.data.pipe(fs.createWriteStream(outputPath));

  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      console.log(`Le fichier PDF a été enregistré sous : ${outputPath}`);
      resolve(outputPath);
    });

    response.data.on('error', (error) => {
      console.error('Erreur lors du téléchargement du PDF :', error);
      reject(error);
    });
  });
}

async function captureWebpage() {
  const outputDir = path.join(__dirname, '../resources/');
  const pdfFileName = 'menu.pdf';
  const screenshotFileName = 'menu.png';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  try {
    await downloadPdf(url_site, outputDir, pdfFileName);
    // Lancez une instance de Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Accédez à l'URL du PDF
    await page.goto(url_pdf);

    // Capturez une image du PDF
    await page.screenshot({ path: url_menu, fullPage: true });

    // Fermez le navigateur Puppeteer
    await browser.close();

    console.log(`L'image a été enregistrée sous : ${url_menu}`);
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
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
