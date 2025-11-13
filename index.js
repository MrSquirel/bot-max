import { startBot } from './src/bot.js';

console.log('🚀 Starting Homework Bot...');
startBot().catch(error => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
});