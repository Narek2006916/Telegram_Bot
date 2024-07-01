const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '7109191302:AAEmsNSp0vMZaXvrBtWnvV0QCcQTdpCS-bs';
const bot = new TelegramBot(token, { polling: true });

const NEWS_API_KEY = 'a992ba3cf8f0400193424bd800e82811';
const NEWS_API_URL = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`;


let userName = {}; 
let favoriteCountries = {}; 

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
    bot.sendMessage(chatId, 'Please enter the country code (e.g., us, gb, in):');
    bot.once('message', (msg) => {
      const country = msg.text.trim().toLowerCase();
      fetchAndSendNews(chatId, country);
    });
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
  }
});

function fetchAndSendNews(chatId, country) {
  const url = country === 'world' ? NEWS_API_URL : `${NEWS_API_URL}&country=${country}`;
  axios.get(url)
    .then(response => {
      const articles = response.data.articles;
      let newsMessage = `Here are the latest news headlines for you, ${userName[chatId]}:\n\n`;

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