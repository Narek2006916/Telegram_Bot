const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7109191302:AAEmsNSp0vMZaXvrBtWnvV0QCcQTdpCS-bs';
const bot = new TelegramBot(token, { polling: true });

const NEWS_API_KEY = 'a992ba3cf8f0400193424bd800e82811';
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`;

let userName = {}; 
let favoriteCountries = {};

const countryCodes = [
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'ar', name: 'Argentina' },
  { code: 'at', name: 'Austria' },
  { code: 'au', name: 'Australia' },
  { code: 'be', name: 'Belgium' },
  { code: 'bg', name: 'Bulgaria' },
  { code: 'br', name: 'Brazil' },
  { code: 'ca', name: 'Canada' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'cn', name: 'China' },
  { code: 'co', name: 'Colombia' },
  { code: 'cu', name: 'Cuba' },
  { code: 'cz', name: 'Czech Republic' },
  { code: 'de', name: 'Germany' },
  { code: 'eg', name: 'Egypt' },
  { code: 'fr', name: 'France' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'gr', name: 'Greece' },
  { code: 'hk', name: 'Hong Kong' },
  { code: 'hu', name: 'Hungary' },
  { code: 'id', name: 'Indonesia' },
  { code: 'ie', name: 'Ireland' },
  { code: 'il', name: 'Israel' },
  { code: 'in', name: 'India' },
  { code: 'it', name: 'Italy' },
  { code: 'jp', name: 'Japan' },
  { code: 'kr', name: 'Korea' },
  { code: 'lt', name: 'Lithuania' },
  { code: 'lv', name: 'Latvia' },
  { code: 'ma', name: 'Morocco' },
  { code: 'mx', name: 'Mexico' },
  { code: 'my', name: 'Malaysia' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'no', name: 'Norway' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'ph', name: 'Philippines' },
  { code: 'pl', name: 'Poland' },
  { code: 'pt', name: 'Portugal' },
  { code: 'ro', name: 'Romania' },
  { code: 'rs', name: 'Serbia' },
  { code: 'ru', name: 'Russia' },
  { code: 'sa', name: 'Saudi Arabia' },
  { code: 'se', name: 'Sweden' },
  { code: 'sg', name: 'Singapore' },
  { code: 'si', name: 'Slovenia' },
  { code: 'sk', name: 'Slovakia' },
  { code: 'th', name: 'Thailand' },
  { code: 'tr', name: 'Turkey' },
  { code: 'tw', name: 'Taiwan' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'us', name: 'United States' },
  { code: 've', name: 'Venezuela' },
  { code: 'za', name: 'South Africa' }
];

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Hello! What is your name?');

  bot.on('message', (msg) => {
    if (!userName[chatId]) {
      userName[chatId] = msg.text;
      bot.sendMessage(chatId, `Nice to meet you, ${userName[chatId]}!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'News in the World', callback_data: 'world_news' }],
            [{ text: 'News by Country', callback_data: 'news_by_country' }],
            [{ text: 'Favorite Countries News', callback_data: 'favorite_countries_news' }],
          ]
        }
      });
    }
  });
});

bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

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
    url = `${NEWS_API_URL}&country=`; 
  } else {
    url = `${NEWS_API_URL}&country=${country}`; 
  }

  axios.get(url)
    .then(response => {
      const articles = response.data.articles;
      let newsMessage = `Here are the latest news headlines for ${country === 'world' ? 'the world' : countryCodes.find(c => c.code === country).name}:\n\n`;

      articles.forEach((article, index) => {
        newsMessage += `${index + 1}. <a href="${article.url}">${article.title}</a>\n`;
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