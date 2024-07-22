import { checkComments, postDailyContent } from './bot.js';

console.log('ZavataBot is starting...');

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initial run
checkComments().catch(error => console.error('Error in initial comment check:', error));
postDailyContent().catch(error => console.error('Error in initial daily post:', error));

console.log('ZavataBot is running...');
