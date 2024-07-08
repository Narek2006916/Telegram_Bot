const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7109191302:AAEmsNSp0vMZaXvrBtWnvV0QCcQTdpCS-bs';
const bot = new TelegramBot(token, { polling: true });

const NEWS_API_KEY = 'a992ba3cf8f0400193424bd800e82811';
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?apiKey=${NEWS_API_KEY}`;

let userName = {}; 
let favoriteCountries = {};

const countryCodes = [
  { code: 'ae', name: 'United Arab Emirates (AE)' },
  { code: 'ar', name: 'Argentina (AR)' },
  { code: 'at', name: 'Austria (AT)' },
  { code: 'au', name: 'Australia (AU)' },
  { code: 'be', name: 'Belgium (BE)' },
  { code: 'bg', name: 'Bulgaria (BG)' },
  { code: 'br', name: 'Brazil (BR)' },
  { code: 'ca', name: 'Canada (CA)' },
  { code: 'ch', name: 'Switzerland (CH)' },
  { code: 'cn', name: 'China (CN)' },
  { code: 'co', name: 'Colombia (CO)' },
  { code: 'cu', name: 'Cuba (CU)' },
  { code: 'cz', name: 'Czech Republic (CZ)' },
  { code: 'de', name: 'Germany (DE)' },
  { code: 'eg', name: 'Egypt (EG)' },
  { code: 'fr', name: 'France (FR)' },
  { code: 'gb', name: 'United Kingdom (GB)' },
  { code: 'gr', name: 'Greece (GR)' },
  { code: 'hk', name: 'Hong Kong (HK)' },
  { code: 'hu', name: 'Hungary (HU)' },
  { code: 'id', name: 'Indonesia (ID)' },
  { code: 'ie', name: 'Ireland (IE)' },
  { code: 'il', name: 'Israel (IL)' },
  { code: 'in', name: 'India (IN)' },
  { code: 'it', name: 'Italy (IT)' },
  { code: 'jp', name: 'Japan (JP)' },
  { code: 'kr', name: 'Korea (KR)' },
  { code: 'lt', name: 'Lithuania (LT)' },
  { code: 'lv', name: 'Latvia (LV)' },
  { code: 'ma', name: 'Morocco (MA)' },
  { code: 'mx', name: 'Mexico (MX)' },
  { code: 'my', name: 'Malaysia (MY)' },
  { code: 'ng', name: 'Nigeria (NG)' },
  { code: 'nl', name: 'Netherlands (NL)' },
  { code: 'no', name: 'Norway (NO)' },
  { code: 'nz', name: 'New Zealand (NZ)' },
  { code: 'ph', name: 'Philippines (PH)' },
  { code: 'pl', name: 'Poland (PL)' },
  { code: 'pt', name: 'Portugal (PT)' },
  { code: 'ro', name: 'Romania (RO)' },
  { code: 'rs', name: 'Serbia (RS)' },
  { code: 'ru', name: 'Russia (RU)' },
  { code: 'sa', name: 'Saudi Arabia (SA)' },
  { code: 'se', name: 'Sweden (SE)' },
  { code: 'sg', name: 'Singapore (SG)' },
  { code: 'si', name: 'Slovenia (SI)' },
  { code: 'sk', name: 'Slovakia (SK)' },
  { code: 'th', name: 'Thailand (TH)' },
  { code: 'tr', name: 'Turkey (TR)' },
  { code: 'tw', name: 'Taiwan (TW)' },
  { code: 'ua', name: 'Ukraine (UA)' },
  { code: 'us', name: 'United States (US)' },
  { code: 've', name: 'Venezuela (VE)' },
  { code: 'za', name: 'South Africa (ZA)' }
];

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `Welcome to the NewsBot! I can provide you with the latest news headlines.\n\nPlease select an option:`;
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'News in the World', callback_data: 'world_news' }],
        [{ text: 'News by Country', callback_data: 'news_by_country' }],
        [{ text: 'Favorite Countries News', callback_data: 'favorite_countries_news' }],
      ]
    }
  });
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

  console.log(`Callback query received: ${action}`);

  if (action === 'world_news') {
    fetchAndSendNews(chatId, 'world');
  } else if (action === 'news_by_country') {
    sendCountryList(chatId);
  } else if (action === 'favorite_countries_news') {
    if (favoriteCountries[chatId] && favoriteCountries[chatId].length > 0) {
      favoriteCountries[chatId].forEach(country => {
        fetchAndSendNews(chatId, country);
      });
    } else {
      bot.sendMessage(chatId, 'You have no favorite countries yet. Please enter a country code to add to your favorites:');
      bot.once('message', (msg) => {
        const country = msg.text.trim().toLowerCase();
        if (!favoriteCountries[chatId]) {
          favoriteCountries[chatId] = [];
        }
        favoriteCountries[chatId].push(country);
        bot.sendMessage(chatId, `${country.toUpperCase()} added to your favorite countries.`);
      });
    }
  } else if (action.startsWith('country_')) {
    const country = action.split('_')[1];
    fetchAndSendNews(chatId, country);
  }
});

function sendCountryList(chatId) {
  const inlineKeyboard = [];
  countryCodes.forEach(country => {
    inlineKeyboard.push([{ text: country.name, callback_data: `country_${country.code}` }]);
  });
  bot.sendMessage(chatId, 'Please choose a country:', {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
}

function fetchAndSendNews(chatId, country) {
  let url;
  if (country === 'world') {
    url = `${NEWS_API_URL}`;
  } else {
    url = `${NEWS_API_URL}&country=${country}`;
  }

  console.log(`Fetching news from URL: ${url}`);

  axios.get(url)
    .then(response => {
      const articles = response.data.articles;
      let newsMessage = `<b>Here are the latest news headlines for ${country === 'world' ? 'the world' : countryCodes.find(c => c.code === country).name}:</b>\n\n`;

      articles.forEach((article, index) => {
        newsMessage += `<b>${index + 1}. <a href="${article.url}">${article.title}</a></b>\n`;
        if (article.urlToImage) {
          newsMessage += `<a href="${article.url}"><img src="${article.urlToImage}" alt="News Image" /></a>\n`;
        }
        if (article.description) {
          newsMessage += `<i>${article.description}</i>\n`;
        }
        newsMessage += `\n`;
      });

      bot.sendMessage(chatId, newsMessage, { parse_mode: 'HTML' });
    })
    .catch(error => {
      console.error(error);
      bot.sendMessage(chatId, 'Sorry, I could not fetch the news at the moment.');
    });
}


bot.on('polling_error', (error) => {
  console.log(error);
});
