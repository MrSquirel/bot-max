import dotenv from 'dotenv';
import { Bot, ImageAttachment, Keyboard, AudioAttachment, FileAttachment, VideoAttachment} from '@maxhub/max-bot-api';

// Импортируем функции из модуля базы данных
import {
    initDatabase,
    ensureChatExists,
    addSubject,
    getSubjects,
    addHomework,
    getHomeworks,
    clearChatData,
    getUserSession,
    updateUserSession,
    clearUserSession
} from './database.js';

dotenv.config();
console.log('BOT_TOKEN =', process.env.BOT_TOKEN);

const bot = new Bot(process.env.BOT_TOKEN);

// Время запуска бота (в миллисекундах)
const BOT_START_TIME = Date.now();
console.log(`Bot started at: ${new Date(BOT_START_TIME).toISOString()}`);

// Клавиатуры
const keyboard = Keyboard.inlineKeyboard([
    [
        Keyboard.button.callback('Посмотреть дз', 'look', { intent: 'positive' }),
        Keyboard.button.callback('Записать дз', 'upload', { intent: 'positive' }),
    ],
    [
        Keyboard.button.callback('🗑️ Очистить базу', 'clear_db', { intent: 'negative' }),
    ]
]);

const Comeback = Keyboard.inlineKeyboard([
    [
        Keyboard.button.callback('Вернуться назад', 'comeback', { intent: 'positive' }),
    ]
]);

let buttonArray_upload = [];
let buttonArray_look = [];
let keyboardSub_u = Keyboard.inlineKeyboard(buttonArray_upload);
let keyboardSub_l = Keyboard.inlineKeyboard(buttonArray_look);

// Функция для проверки, было ли сообщение отправлено после запуска бота
function isMessageAfterStart(timestamp) {
    return timestamp >= BOT_START_TIME;
}

// Функция для получения chat_id
function getChatId(ctx) {
    return ctx.message.recipient.chat_id;
}

// Функция для обновления клавиатур из базы данных
async function updateKeyboardsFromDB(chatId) {
    const subjects = await getSubjects(chatId);
    
    buttonArray_upload = [
        [Keyboard.button.callback('Создать новый предмет', 'create', { intent: 'positive' })]
    ];
    
    buttonArray_look = [];
    
    subjects.forEach(subject => {
        buttonArray_upload.push([
            Keyboard.button.callback(subject.name, `upload_${subject.id}`, { intent: 'positive' })
        ]);
        
        buttonArray_look.push([
            Keyboard.button.callback(subject.name, `look_${subject.id}`, { intent: 'positive' })
        ]);
    });
    
    keyboardSub_u = Keyboard.inlineKeyboard(buttonArray_upload);
    keyboardSub_l = Keyboard.inlineKeyboard(buttonArray_look);
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
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old /start command from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await ensureChatExists(chatId);
        await clearUserSession(chatId);
        await updateKeyboardsFromDB(chatId);
        
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
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old /upload command from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await updateKeyboardsFromDB(chatId);
        
        await ctx.reply('Выбери куда записать', {attachments: [keyboardSub_u]});
    } catch (error) {
        console.error('Error in upload command:', error);
    }
});

// Обработчик команды /check с проверкой времени
bot.command('check', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old /check command from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await updateKeyboardsFromDB(chatId);
        
        await ctx.reply('Выбери предмет в котором хочешь домашнее задание', {attachments: [keyboardSub_l]});
    } catch (error) {
        console.error('Error in check command:', error);
    }
});

// Обработчик кнопки "Посмотреть дз" с проверкой времени
bot.action('look', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old look action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await updateKeyboardsFromDB(chatId);
        
        await updateUserSession(chatId, { flagUpload: false });
        await ctx.reply('Выбери предмет в котором хочешь домашнее задание', {attachments: [keyboardSub_l]});
        
    } catch (error) {
        console.error('Error in look action:', error);
    }
});

// Обработчик кнопки "Записать дз" с проверкой времени
bot.action('upload', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old upload action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await updateKeyboardsFromDB(chatId);
        
        await updateUserSession(chatId, { flagUpdate: false });
        await ctx.reply('Выбери предмет куда записать:', {attachments: [keyboardSub_u]});
        
    } catch (error) {
        console.error('Error in upload action:', error);
    }
});

// Обработчик кнопки "Создать новый предмет" с проверкой времени
bot.action('create', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old create action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await updateUserSession(chatId, { flagUpdate: true });
        
        await ctx.reply('Напиши название предмета (не используй нижнее подчеркивание)');
    } catch (error) {
        console.error('Error in create action:', error);
    }
});

// Обработчик кнопки "Вернуться назад" с проверкой времени
bot.action('comeback', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old comeback action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await updateKeyboardsFromDB(chatId);
        
        await ctx.reply('Возвращаемся в главное меню', {attachments: [keyboard]});
    } catch (error) {
        console.error('Error in comeback action:', error);
    }
});

// Обработчик кнопки "Очистить базу"
bot.action('clear_db', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old clear_db action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const chatId = getChatId(ctx);
        await clearChatData(chatId);
        await clearUserSession(chatId);
        await updateKeyboardsFromDB(chatId);
        
        await ctx.reply('✅ База данных очищена! Все предметы и домашние задания удалены.', {attachments: [keyboard]});
    } catch (error) {
        console.error('Error in clear_db action:', error);
        await ctx.reply('❌ Ошибка при очистке базы данных');
    }
});

// Обработчик для просмотра домашних заданий по предмету
bot.action(/^look_(\d+)$/, async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old look subject action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const subjectId = ctx.match[1];
        const chatId = getChatId(ctx);
        
        const homeworks = await getHomeworks(chatId, subjectId);
        
        if (homeworks.length > 0) {
            await ctx.reply(`📚 Домашние задания по предмету:`);
            
            for (const homework of homeworks) {
                const type = homework.type;
                const content = homework.content;
                
                if (type === 'text') {
                    await ctx.reply(`📝 ${content}`);
                }
                else if (type === 'image') {
                    const image = new ImageAttachment({ token: content });
                    await ctx.reply('🖼️ Изображение:', { attachments: [image.toJson()] });
                }
                else if (type === 'audio') {
                    const audio = new AudioAttachment({ token: content });
                    await ctx.reply('🎵 Аудио:', { attachments: [audio.toJson()] });
                }
                else if (type === 'video') {
                    const video = new VideoAttachment({ token: content });
                    await ctx.reply('🎥 Видео:', { attachments: [video.toJson()] });
                }
                else if (type === 'file') {
                    const file = new FileAttachment({ token: content });
                    await ctx.reply('📎 Файл:', { attachments: [file.toJson()] });
                }
                else {
                    await ctx.reply(`📄 ${content}`);
                }
            }
        } else {
            await ctx.reply('📭 По этому предмету нет домашнего задания');
        }
        
        await ctx.reply('Вернись обратно', {attachments: [Comeback]});
        
    } catch (error) {
        console.error('Error in look subject action:', error);
        await ctx.reply('❌ Ошибка при загрузке домашнего задания');
    }
});

// Обработчик для выбора предмета для загрузки ДЗ
bot.action(/^upload_(\d+)$/, async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old upload subject action from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const subjectId = ctx.match[1];
        const chatId = getChatId(ctx);
        
        // Сохраняем subjectId в базу данных
        await updateUserSession(chatId, { 
            uploadSubjectId: subjectId,
            flagUpload: true 
        });
        
        console.log(`📝 User ${chatId} selected subject ${subjectId} for upload`);
        
        await ctx.reply('Отправьте сообщение с домашним заданием (текст, картинка или файл)');
        
    } catch (error) {
        console.error('Error in upload subject action:', error);
    }
});

// Обработчик входящих сообщений с проверкой времени
bot.on('message_created', async (ctx) => {
    try {
        if (!isMessageAfterStart(ctx.message.timestamp)) {
            console.log('Ignoring old message from:', new Date(ctx.message.timestamp).toISOString());
            return;
        }
        
        const messageText = ctx.message.body.text;
        const chatId = getChatId(ctx);
        
        // Получаем текущую сессию пользователя
        const session = await getUserSession(chatId);
        
        console.log(`📨 Message from ${chatId}:`, { 
            text: messageText, 
            hasAttachments: !!ctx.message.body.attachments,
            session: session 
        });
        
        if (messageText === '/check') {
            console.log('check command received');
            await ctx.reply('Это справочное сообщение');
        }
        
        // Обработка создания нового предмета
        if (session.flagUpdate) {
            console.log('🔄 Processing subject creation...');
            
            if (ctx.message.body.attachments && ctx.message.body.attachments.length > 0) {
                const attachments = ctx.message.body.attachments;
                const token = attachments[0].payload.token;
                console.log('Attachments received during subject creation:', attachments);
                
                const image = new ImageAttachment({ token: token });
                await ctx.reply('', { attachments: [image.toJson()] });
                await ctx.reply('Вернись обратно', {attachments: [Comeback]});
            } else {
                const subjectName = ctx.message.body.text;
                
                if (subjectName && subjectName.trim()) {
                    const subjectId = await addSubject(chatId, subjectName.trim());
                    await updateKeyboardsFromDB(chatId);
                    
                    console.log(`✅ Subject created: ${subjectName} with ID: ${subjectId}`);
                    
                    await ctx.reply(`✅ Предмет "${subjectName}" создан! Вернись обратно`, {attachments: [Comeback]});
                } else {
                    await ctx.reply('❌ Пожалуйста, введите название предмета');
                    return;
                }
            }
            
            await updateUserSession(chatId, { flagUpdate: false });
        }
        
        // Обработка загрузки домашнего задания
        if (session.flagUpload && session.uploadSubjectId) {
            console.log('📝 Processing homework upload...');
            
            const subjectId = session.uploadSubjectId;
            let content = '';
            let type = 'text';
            
            if (ctx.message.body.attachments && ctx.message.body.attachments.length > 0) {
                const attachments = ctx.message.body.attachments;
                const token = attachments[0].payload.token;
                type = attachments[0].type;
                content = token;
                
                console.log(`📎 Attachment detected: type=${type}, token=${token}`);
            } else {
                content = ctx.message.body.text || '';
                type = 'text';
                console.log(`📝 Text detected: ${content}`);
            }
            
            if (content) {
                const homeworkId = await addHomework(chatId, subjectId, type, content);
                console.log(`✅ Homework saved with ID: ${homeworkId}`);
                
                await ctx.reply('✅ Сообщение принято и сохранено в базе данных!');
            } else {
                await ctx.reply('❌ Сообщение пустое, ничего не сохранено');
            }
            
            // Очищаем сессию
            await clearUserSession(chatId);
        }
    } catch (error) {
        console.error('❌ Error in message_created handler:', error);
        console.error('Error details:', error.stack);
    }
});

// Обработка ошибок
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Запуск бота с инициализацией базы данных
export async function startBot() {
    try {
        // Инициализируем базу данных (можно передать путь к БД)
        const dbPath = process.env.DB_PATH || './data/homework.db';
        await initDatabase(dbPath);
        
        await bot.start();
        console.log('✅ Bot started successfully');
        console.log('🤖 Bot will ignore messages before:', new Date(BOT_START_TIME).toISOString());
        console.log('🗄️ Database path:', dbPath);
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Экспортируем бота для использования в других модулях
export { bot };

// Если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    startBot();
}