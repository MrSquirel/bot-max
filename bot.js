import dotenv from 'dotenv';
import { Bot, ImageAttachment, Keyboard, AudioAttachment, FileAttachment, VideoAttachment} from '@maxhub/max-bot-api';

dotenv.config({ path: './process.env' });
console.log('BOT_TOKEN =', process.env.BOT_TOKEN);

const bot = new Bot(process.env.BOT_TOKEN);

// Время запуска бота (в миллисекундах)
const BOT_START_TIME = Date.now();
console.log(`Bot started at: ${new Date(BOT_START_TIME).toISOString()}`);

const keyboard = Keyboard.inlineKeyboard([
  [
    Keyboard.button.callback('Посмотреть дз', 'look', { intent: 'positive' }),
    Keyboard.button.callback('Записать дз', 'upload', { intent: 'positive' }),
  ], 
]);

const Comeback = Keyboard.inlineKeyboard([
  [
    Keyboard.button.callback('Вернуться назад', 'comeback', { intent: 'positive' }),
  ], 
]);

const buttonArray_upload = [
  [
    Keyboard.button.callback('Создать новый предмет', 'create', { intent: 'positive' }),
  ],
];
const keyboardSub_u = Keyboard.inlineKeyboard(buttonArray_upload);

const buttonArray_look = [];
const keyboardSub_l = Keyboard.inlineKeyboard(buttonArray_look);

const colls_u = [];
const colls_l = [];
const Homework = new Map();
let count = 0;
let Flag_update = false;
let Flag_upload = false;

// Функция для проверки, было ли сообщение отправлено после запуска бота
function isMessageAfterStart(timestamp) {
  // Если timestamp меньше времени запуска бота - сообщение старое
  return timestamp >= BOT_START_TIME;
}

// Установка команд бота
bot.api.setMyCommands([
  {name: 'start', description: 'Начать общение'},
  {name: 'upload', description: 'Загрузить дз'},
  {name: 'check', description: 'Посмотреть дз'},
]);

// Обработчик команды /start с проверкой времени
bot.command('start', async (ctx) => {
  try {
    // Проверяем время сообщения
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old /start command from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    await ctx.reply(
      'Привет! Я чат-бот который поможет тебе с сохранением твоей домашки, выбери то, что хочешь со мной сделать',
      {attachments: [keyboard]}
    );
  } catch (error) {
    console.error('Error in start command:', error);
  }
});

// Обработчик команды /upload с проверкой времени
bot.command('upload', async (ctx) => {
  try {
    // Проверяем время сообщения
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old /upload command from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    await ctx.reply('Выбери куда записать', {attachments: [keyboardSub_u]});
  } catch (error) {
    console.error('Error in upload command:', error);
  }
});

// Обработчик команды /check с проверкой времени
bot.command('check', async (ctx) => {
  try {
    // Проверяем время сообщения
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old /check command from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    await ctx.reply('Выбери предмет в котором хочешь домашнее задание', {attachments: [keyboardSub_l]});
  } catch (error) {
    console.error('Error in check command:', error);
  }
});

// Обработчик кнопки "Посмотреть дз" с проверкой времени
bot.action('look', async (ctx) => {
  try {
    // Для callback событий также проверяем время
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old look action from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    Flag_upload = false;
    await ctx.reply('Выбери предмет в котором хочешь домашнее задание', {attachments: [keyboardSub_l]});
    
    // Динамически регистрируем обработчики для предметов
    const numb = buttonArray_look.length;
    if (numb > 0) {
      for (let i = 0; i < numb; i++) {
        const subjectKey = colls_l[i];
        if (subjectKey) {
          bot.action(subjectKey, async (ctx) => {
            // Проверяем время для динамических действий
            if (!isMessageAfterStart(ctx.message.timestamp)) {
              console.log('Ignoring old subject action from:', new Date(ctx.message.timestamp).toISOString());
              return;
            }
            
            const homework = Homework.get(subjectKey);
            if (homework) {
              for (let j = 0; j < homework.length; j ++) {
                console.log(homework[j][0])
                console.log(homework[j][1])
                const type = homework[j][0]
                const text = homework[j][1]
                if (type === 'text') {
                  await ctx.reply(`Домашнее задание по предмету:\n${text}`);
                }
                else if (type === 'image') {
                  
                  const image = new ImageAttachment({ token: text });
                  await ctx.reply('Домашнее задание по предмету:', { attachments: [image.toJson()] });
                }
                else if (type === 'audio') {
                  const audio = new AudioAttachment({ token: text });
                  await ctx.reply('Домашнее задание по предмету:', { attachments: [audio.toJson()] });
                }
                else if (type === 'video') {
                  const video = new VideoAttachment({ token: text });
                  await ctx.reply('Домашнее задание по предмету:', { attachments: [video.toJson()] });
                }
                else if (type === 'file') {
                  const file = new FileAttachment({ token: text });
                  await ctx.reply('Домашнее задание по предмету:', { attachments: [file.toJson()] });
                }
                else {
                  await ctx.reply(`Домашнее задание по предмету:\n${text}`);
                }
              }
            } else {
              await ctx.reply('По этому предмету нет домашнего задания');
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in look action:', error);
  }
});

// Обработчик кнопки "Записать дз" с проверкой времени
bot.action('upload', async (ctx) => {
  try {
    // Проверяем время callback
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old upload action from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    Flag_update = false;
    await ctx.reply('Выбери предмет куда записать:', {attachments: [keyboardSub_u]});
    
    // Динамически регистрируем обработчики для предметов
    const numb = buttonArray_upload.length;
    if (numb > 1) {
      for (let i = 1; i < numb; i++) {
        const subjectKey = colls_u[i-1];
        if (subjectKey) {
          bot.action(subjectKey, async (ctx) => {
            // Проверяем время для динамических действий
            if (!isMessageAfterStart(ctx.message.timestamp)) {
              console.log('Ignoring old subject upload action from:', new Date(ctx.message.timestamp).toISOString());
              return;
            }
            
            await ctx.reply('Отправьте сообщение с домашним заданием (текст, картинка или файл, но не все сразу)');
            Flag_upload = true;
            count = i;
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in upload action:', error);
  }
});

// Обработчик кнопки "Создать новый предмет" с проверкой времени
bot.action('create', async (ctx) => {
  try {
    // Проверяем время callback
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old create action from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    await ctx.reply('Напиши название предмета (не используй нижнее подчеркивание)');
    Flag_update = true;
  } catch (error) {
    console.error('Error in create action:', error);
  }
});

// Обработчик кнопки "Вернуться назад" с проверкой времени
bot.action('comeback', async (ctx) => {
  try {
    // Проверяем время callback
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old comeback action from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    await ctx.reply('Возвращаемся в главное меню', {attachments: [keyboard]});
  } catch (error) {
    console.error('Error in comeback action:', error);
  }
});

// Обработчик входящих сообщений с проверкой времени
bot.on('message_created', async (ctx) => {
  try {
    // Проверяем время сообщения
    if (!isMessageAfterStart(ctx.message.timestamp)) {
      console.log('Ignoring old message from:', new Date(ctx.message.timestamp).toISOString());
      return;
    }
    
    const messageText = ctx.message.body.text;
    
    if (messageText === '/check') {
      console.log('check command received');
      await ctx.reply('Это справочное сообщение');
    }
    
    if (Flag_update === true) {
      if (ctx.message.body.attachments && ctx.message.body.attachments.length > 0) {
        const attachments = ctx.message.body.attachments;
        const url = attachments[0].payload.url;
        const token = attachments[0].payload.token;
        console.log('Attachments:', attachments);
        console.log('URL:', url);
        console.log('Token:', token);
        const image = new ImageAttachment({ token: token });
        await ctx.reply('', { attachments: [image.toJson()] });
        await ctx.reply('Вернись обратно', {attachments: [Comeback]});
      } else {
        const text = ctx.message.body.text;
        const numb = buttonArray_upload.length;

        console.log('Creating new subject:', text);
        console.log('Current button count:', numb);

        const subjectKeyUpload = text + '_u' + numb.toString();
        const subjectKeyLook = text + '_l' + numb.toString();

        colls_u.push(subjectKeyUpload);
        colls_l.push(subjectKeyLook);

        console.log('Upload subjects:', colls_u);
        console.log('Look subjects:', colls_l);

        // Добавляем новую кнопку для загрузки
        buttonArray_upload.push([
          Keyboard.button.callback(text, subjectKeyUpload, { intent: 'positive' })
        ]);
        
        // Добавляем новую кнопку для просмотра
        buttonArray_look.push([
          Keyboard.button.callback(text, subjectKeyLook, { intent: 'positive' })
        ]);

        // Создаем новые клавиатуры
        const newKeyboardSub_u = Keyboard.inlineKeyboard(buttonArray_upload);
        const newKeyboardSub_l = Keyboard.inlineKeyboard(buttonArray_look);

        await ctx.reply(`Предмет "${text}" создан! Вернись обратно`, {attachments: [Comeback]});
        
        // Обновляем глобальные клавиатуры
        Object.assign(keyboardSub_u, newKeyboardSub_u);
        Object.assign(keyboardSub_l, newKeyboardSub_l);
        
        Flag_update = false;
      }
    }
    
    if (Flag_upload === true && count > 0) {
      const key = colls_l[count-1];
      let text = 'text'
      const attachments = ctx.message.body.attachments;
      let type = 'text'
    
      console.log(attachments)
      console.log(type)
      console.log(ctx.message)
      
      if (attachments && attachments.length > 0) {
        const token = attachments[0].payload.token;
        const url = attachments[0].payload.url;
        console.log('Attachments:', attachments);
        console.log('URL:', url);
        type = attachments[0].type
        text = token
      }
      else {
        text = ctx.message.body.text;
      }
      
      if (Homework.has(key)) {
        Homework.get(key).push([type, text]);
      } else {
        Homework.set(key, [[type, text]]);
      }
      
      await ctx.reply('Сообщение принято и сохранено!');
      console.log('Homework map:', Homework);
      Flag_upload = false;
      count = 0;
    }
  } catch (error) {
    console.error('Error in message_created handler:', error);
  }
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Запуск бота
bot.start().then(() => {
  console.log('Bot started successfully');
  console.log('Bot will ignore messages before:', new Date(BOT_START_TIME).toISOString());
}).catch(error => {
  console.error('Failed to start bot:', error);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));