import dotenv from 'dotenv';
import { Bot, Keyboard } from '@maxhub/max-bot-api';

dotenv.config({ path: './process.env' });
console.log('BOT_TOKEN =', process.env.BOT_TOKEN);

const bot = new Bot(process.env.BOT_TOKEN);

const keyboard = Keyboard.inlineKeyboard([
  [
    Keyboard.button.callback('Посмотреть дз', 'look', { intent: 'positive' }),
    Keyboard.button.callback('Записать дз', 'upload', { intent: 'positive' }),
  ], 
]);

const Comeback = Keyboard.inlineKeyboard([
  [
    Keyboard.button.callback('Вернуться назад', 'upload', { intent: 'positive' }),
  ], 
]);

const buttonArray_upload = [
  [
    Keyboard.button.callback('Создать новый предмет', 'create', { intent: 'positive' }),
  ],
];
const keyboardSub_u = Keyboard.inlineKeyboard(buttonArray_upload);

const buttonArray_look = [[],];
const keyboardSub_l = Keyboard.inlineKeyboard(buttonArray_look);

const colls_u = []
const colls_l = []
const Homework = new Map()
let count = 0
let Flag_update = false
let Flag_upload = false

bot.api.setMyCommands([
  {
    name: 'start', description: 'Начать общение',
  },
]);

bot.command('start', async (ctx) => {

  await ctx.reply(
    'Привет! Я чат-бот который поможет тебе с сохранением твоей домашки, выбери то, что хочешь со мной сделать',
    {attachments: [keyboard]}
  );
});

// Обработка callback от кнопки
bot.action('look', async (ctx) => {
  ctx.reply('Выбери предмет в котором хочешь домашнее задание', {attachments: [keyboardSub_l]})
  const numb = buttonArray_look.length
  if (numb > 0) {
    for (let i = 0; i <= numb; i++) {
      bot.action(colls_l[i], async(ctx) => {
        ctx.reply(`${Homework.get(colls_l[i])}`)
      })
    }
  }

});

bot.action('upload', async (ctx) => {
  Flag_update = false
  ctx.reply('Выбери предмет куда записать:', {attachments: [keyboardSub_u]})
  const numb = buttonArray_upload.length

  if (numb > 1) {
    for (let i = 1; i <= numb; i++) {
      bot.action(colls_u[i-1], async(ctx) => {
        ctx.reply('Отправьте сообщение с домашним заданием(фото, текст, фото + текст)')
        Flag_upload = true
        count = i
      })
    }
  }

});



bot.on('message_created', (ctx) =>{
    if (Flag_update === true) {
    console.log(ctx.message.body.text)

    const text = ctx.message.body.text
    const numb = buttonArray_upload.length

    console.log(buttonArray_upload.length)

    colls_u.push(text + '_u' + numb.toString())
    colls_l.push(text + '_l' + numb.toString())

    console.log(colls_u)
    console.log(colls_l)

    buttonArray_upload.push([Keyboard.button.callback(text, `${colls_u[numb-1]}`, { intent: 'positive' })])
    buttonArray_look.push([Keyboard.button.callback(text, `${colls_l[numb-1]}`, { intent: 'positive' })])
    ctx.reply('Вернись обратно', {attachments: [Comeback]})
    }
    if (Flag_upload === true) {
      const key = colls_l[count-1];
      const text = ctx.message.body.text;
      if (Homework.has(key)) {
        Homework.get(key).push(text);
      } 
      else {
        Homework.set(key, [text]);
      }
      ctx.reply('Сообщение принято');
      console.log(Homework);
      Flag_upload = false
    }
  })



bot.action('create', async (ctx) => {
  ctx.reply('Напиши название предмета (не используй нижнее подчеркивание)')
  Flag_update = true
});

bot.start()