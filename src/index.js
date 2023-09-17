const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, prefix, admin_role, id_guild, bot_channel } = require('../resources/config.json');
const { pdfToPng } = require("pdf-to-png-converter")

let { date_envoi } = require('../resources/config.json');

const axios = require('axios');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '../resources/config.json');
const url_site = "https://lycee-elie-vinet.fr/pdf_lycee/menu.pdf";

const jsonConfig = require(filePath);
let targetTime = jsonConfig.date_envoi;
let isSendingMenu = false;

const client = new Client({ intents: [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent] });

/**
 * Trigger timer to send menu each week
 */
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

  if(targetTime === undefined) targetTime = new Date(now.getFullYear(), now.getMonth(), friday, 21, 0, 0);
  if (!isSendingMenu) checkIfPossible();
});

/**
 * Commands handler
 */
client.on("messageCreate", (message)  => {
  const elements = extractElements(message.content);

  if (message.mentions.users.has(client.user.id)) {
    message.reply("Bonjour, mes commandes sont listés en écrivant " + prefix + "help.");
  } 
  date_envoi = message.content;

  if (prefix !== elements.local_prefix) return

  console.log("Commande:", elements.local_command);
  if (elements.local_message) console.log("Texte:", elements.local_message);
  let date = new Date();
  switch (elements.local_command) {
    case "menu":
      if(message.member.roles.cache.find(r => r.id === admin_role)) {
        sendMenu();
      }
      break;
    case "where":
      message.channel.send("URL : " + url_site);
      break;
    case "when":
      let friday = new Date(date.setDate(date.getDate()-date.getDay()+5)).toLocaleDateString();
      let output;
      if (isSendingMenu) output = "En cours d'envoie pour le " + friday + " à 21h00."
      else output = "Est prévu pour le " + friday + " à 21h00.\nProblème détecté au niveau de la vérification d'envoi."
      message.channel.send(output);
      break;
    case "pdf":
      message.channel.send("Téléchargement en cours, veuillez patienter. Temps d'attente estimé, 30 secondes.")
      message.channel.send({
        files: [{
            attachment: url_site,
            name: 'NotaVirus.exe.pdf.txt.png'
        }]
      });
      break;
    case "set":
      if(!message.member.roles.cache.find(r => r.id === admin_role)) break;
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth();
      let day = elements.local_message.split(":")[0];
      let hour = elements.local_message.split(":")[1];
      let minute = elements.local_message.split(":")[2];

      if (day === '') day = now.getDay();
      if (hour === undefined) hour = now.getHours();
      if (minute === undefined) minute = now.getMinutes()+5;
      let name_day = getDay(day);

      targetTime = new Date(year, (parseInt(month)-1), (parseInt(day)-1), hour, minute);
      
      message.channel.send("Timer lancé sur tous les " + name_day + " à " + hour + "h" + minute + " à +/- 10mn.")
      
      const jsonData = require(filePath);
      jsonData.date_envoi = targetTime;
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

      console.log('La valeur a été modifiée avec succès.');
      break;
    case "tony":
      message.channel.send("Roi des rats :crown:");
      break;
    case "h":
    case "help":
      message.channel.send("Mes commandes sont : \n\t\
      !menu  => Permet de poster le menu dans le salon du menu.\n\t\
      !where => Permet de connaitre où le menu peut se trouver sur le web.\n\t\
      !when  => Permet de savoir quand le menu pourra être posté.\n\t\
      !pdf   => Permet d'avoir le PDF.\n\t\
      !set   => Permet de rentrer une nouvelle pour l'envoi hebdomadaire du menu, la date demandé doit être sous la forme **dd:hh:mm**\n\t\t\
      Où **dd** est le numéro du jour de Lundi = 1 à Dimanche = 7 ; **hh** est l'heure et **mm** les minutes");
      break;
    default:
      break;
  }
})

/**
 * Download PDF File from url and put it in ../resources
 * @param url String, url web of wanted file
 * @param outputDir String, url of output
 * @param outputFileName String, desired pdf file name
 */
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

/**
 * Convert a PDF File to a PNG File
 */
async function convertToPNG() {
  const outputDir = path.join(__dirname, '../resources/');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  try {
    await downloadPdf(url_site, outputDir, 'menu.pdf');
    const pngPages = await pdfToPng(path.join(outputDir, 'menu.pdf'), 
      {
          disableFontFace: false,
          useSystemFonts: false,
          enableXfa: false,
          viewportScale: 2.0,
          outputFolder: outputDir,
          outputFileMask: 'menu',
          pdfFilePassword: 'pa$$word',
          pagesToProcess: [1],
          strictPagesToProcess: false,
          verbosityLevel: 1
      });
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}
/**
 * Check if we are in the right guild, channel and if it's time to send the file
 */
async function checkIfPossible() {
  const channel = client.guilds.cache.get(id_guild).channels.cache.get(bot_channel);
  if (!channel) return console.error(`Le canal avec l'ID ${bot_channel} n'a pas été trouvé.`);

  const now = new Date();
  let friday = new Date(now.setDate(now.getDate()-now.getDay()+5)).toLocaleDateString();

  if (!targetTime) targetTime = new Date(now.getFullYear(), now.getMonth(), friday, 21, 0, 0);
  isSendingMenu = true;

  if (now >= targetTime) sendMenu()
  else setTimeout(checkIfPossible, 10 * 60 * 1000);
}

/**
 * Send the message with the PNG File as attachment
 */
async function sendMenu() {

  const attachment = path.join(__dirname, '../resources/menu_page_1.png');
  const channel = client.guilds.cache.get(id_guild).channels.cache.get(bot_channel);

  let date = new Date();
  let monday = new Date(date.setDate(date.getDate()-date.getDay()+1)).toLocaleDateString();
  let friday = new Date(date.setDate(date.getDate()-date.getDay()+5)).toLocaleDateString();

  try {
    await convertToPNG()
      .then(() => console.log("Conversion en PNG faite"))
      .catch(error => console.error('Une erreur s\'est produite :', error));
    
    channel.send({
      files: [{
          attachment: attachment,
          name: 'NotaVirus.exe.pdf.txt.png'
      }]
    }).then(() => {
      setTimeout(sendMenu, 7 * 24 * 60 * 60 * 1000);
    });
  } catch (error) {
    console.error('Une erreur s\'est produite :', error);
  }
}

/**
 * Extract elements from a received message, return prefix used, command and the rest
 * @param message String, message receive from users
 * @returns object with local_prefix, local_command and local_message
 */
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


/**
 * Retourne le libellé du jour 
 * 
 * @param {number} day Numéro du jour, de 1 à 7 
 * @returns {String} nom du jour
 */
function getDay(day) {
  if (day == 1) return "Lundi"
  else if (day == 2) return "Mardi"
  else if (day == 3) return "Mercredi"
  else if (day == 4) return "Jeudi"
  else if (day == 5) return "Vendredi"
  else if (day == 6) return "Samedi"
  else return "Dimanche";
}

client.login(token);
