import Snoowrap from 'snoowrap';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import cron from 'node-cron';
import { EmailClient } from '@azure/communication-email';
import config from './config.js';
import prompts from './prompts.js';
import fetch from 'node-fetch';

const r = new Snoowrap({
  userAgent: config.userAgent,
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  username: config.username,
  password: config.password,
});

const openAIClient = new OpenAIClient(
  config.azureOpenAIEndpoint,
  new AzureKeyCredential(config.azureOpenAIApiKey)
);

const connectionString = "endpoint=https://cold-email.unitedstates.communication.azure.com/;accesskey=84kDQsyzaA0rG8gKcUZ3mgG3PIShtn0pK6v7Il7Q3yoWXrMb53c1JQQJ99AGACULyCpqMMGeAAAAAZCSDnQW";
const emailClient = new EmailClient(connectionString);

async function sendEmailNotification(subject, text) {
  const emailMessage = {
    senderAddress: "sarah@zavata.ai",
    content: {
      subject: subject,
      plainText: text,
    },
    recipients: {
      to: [{ address: "harshith@zavata.ai" }],
    },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    await poller.pollUntilDone();
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function checkComments() {
  try {
    const comments = await r.getNewComments('all', { limit: 25 });
    for (const comment of comments) {
      if (comment.body.toLowerCase().includes('ai interviewer') && comment.author.name !== config.username) {
        await postComment(comment);
      }
    }
  } catch (error) {
    console.error('Error checking comments:', error);
  }
}

async function postComment(comment) {
  try {
    const content = await generateContent(prompts.commentReply.replace('"{comment.body}"', comment.body));
    await comment.reply(content);
    console.log('Replied to comment:', comment.id);
  } catch (error) {
    console.error('Error posting comment:', error);
  }
}

async function generateContent(prompt) {
  try {
    const response = await openAIClient.getChatCompletions(
      config.azureOpenAIDeployment,
      [
        { role: "system", content: "You are an AI expert in recruiting and HR technology, promoting Zavata.ai." },
        { role: "user", content: prompt }
      ],
      { maxTokens: 300 }
    );
    return response.choices[0].message.content + '\n\nLearn more about Zavata.ai: https://www.zavata.ai/';
  } catch (error) {
    console.error('Error generating content:', error);
    return 'Zavata.ai is revolutionizing the recruiting process with AI-powered interviews.\n\nLearn more about Zavata.ai: https://www.zavata.ai/';
  }
}

async function postDailyContent() {
  try {
    const subreddits = ['test', 'microsaas', 'saas', 'micro_saas', 'salesforce', 'jobsearchhacks', 'careerguidance', 'humanresources', 'startups', 'entrepreneur',
       'WorkOnline', 'ProductManagement', 'remotework', 'TalentAcquisition', 'DataScienceJobs', 'cscareerquestions', 'IndieHackers', 'SideProject', 'ProductHunters',
        'Leadership', 'DeepLearning', 'DevOpsJobs', 'ITJobs', 'SysAdminJobs', 'SmallBusiness', 'B2B', 'RecruitmentMarketing', 'EmployerBranding', 'microsaas', 'zavataai', 'AIRecruitment', 
        'SaaSInnovations', 'JobSeekerAI', 'startup_ideas', 'venturecapital', 'TechStartups', 'Fintech', 'HealthTech', 'EdTech', 'LegalTech', 'LegalTechAI', 'Consulting', 'ITCareerQuestions', 'TechNews']; // Add your subreddits here

    let successfulPosts = [];
    let failedPosts = [];

    for (const subreddit of subreddits) {
      const { title, content } = await generateUniqueContentForSubreddit(subreddit);
      try {
        await r.getSubreddit(subreddit).submitSelfpost({ title, text: content });
        console.log(`Daily post submitted successfully in subreddit: ${subreddit}`);
        successfulPosts.push(subreddit);
        await sendEmailNotification(`Post Successful in ${subreddit}`, `Successfully posted to ${subreddit}`);
        await randomDelay(); // Random delay between posts
      } catch (error) {
        console.error(`Error submitting daily post to subreddit ${subreddit}:`, error);
        failedPosts.push({ subreddit, error: error.message });
        await sendEmailNotification(`Post Failed in ${subreddit}`, `Failed to post to ${subreddit}: ${error.message}`);
      }
    }

    const successText = successfulPosts.length > 0 ? `Successfully posted to: ${successfulPosts.join(', ')}` : 'No successful posts today.';
    const failedText = failedPosts.length > 0 ? `Failed posts:\n${failedPosts.map(f => `Subreddit: ${f.subreddit}, Error: ${f.error}`).join('\n')}` : 'No failed posts today.';

    const emailContent = `Hello Harshith,

The daily posts have been processed.

${successText}

${failedText}

For more details, visit: https://www.zavata.ai/

Best,
Sarah Blake (AI Virtual Assistant)`;

    await sendEmailNotification('Daily Reddit Posting Report', emailContent);
  } catch (error) {
    console.error('Error submitting daily post:', error);
    await sendEmailNotification('Error in Daily Posting', `An error occurred during the daily post submission. Error: ${error.message}`);
  }
}

async function generateUniqueContentForSubreddit(subreddit) {
  const title = await generateUniqueTitle(subreddit);
  const content = await generateContent(prompts.dailyPost.replace('Zavata.ai', `Zavata.ai in ${subreddit}`));
  return { title, content };
}

async function generateUniqueTitle(subreddit) {
  const response = await openAIClient.getChatCompletions(
    config.azureOpenAIDeployment,
    [
      { role: "system", content: "You are an AI expert in recruiting and HR technology, promoting Zavata.ai." },
      { role: "user", content: `Generate a unique title for a Reddit post about AI Interviewers and the Future of Recruiting with Zavata.ai in ${subreddit}.` }
    ],
    { maxTokens: 50 }
  );
  return response.choices[0].message.content;
}

function randomDelay() {
  const min = 600000; // 10 minutes
  const max = 3600000; // 60 minutes
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function followUpOnComments() {
  try {
    const comment = await r.getComment('r/SaaS/comment_id_here'); // Replace with the actual comment ID
    if (comment) {
      const followUpReply = 'Thank you for your interest! If you have any questions about Zavata.ai or want to know more about our AI-powered interviewers, feel free to ask!';
      await comment.reply(followUpReply);
      console.log('Follow-up reply posted:', comment.id);
    }
  } catch (error) {
    console.error('Error posting follow-up comment:', error);
  }
}

// Monitor RSS feeds
async function monitorRSSFeeds() {
  try {
    const feeds = [
      'https://old.reddit.com/user/BotherAware7848/upvoted.rss',
      'https://old.reddit.com/user/BotherAware7848/downvoted.rss',
      'https://old.reddit.com/user/BotherAware7848/saved.rss',
      'https://old.reddit.com/user/BotherAware7848/hidden.rss',
      'https://old.reddit.com/message/inbox/.rss',
      'https://old.reddit.com/message/unread/.rss',
      'https://old.reddit.com/message/messages/.rss',
      'https://old.reddit.com/message/comments/.rss',
      'https://old.reddit.com/message/selfreply.rss',
      'https://old.reddit.com/message/mentions.rss'
    ];

    for (const feed of feeds) {
      const response = await fetch(feed);
      const text = await response.text();
      const comments = parseRSSFeed(text);
      for (const comment of comments) {
        if (comment.includes('AI interviewer') || comment.includes('hiring')) {
          await postCommentToRSS(comment);
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring RSS feeds:', error);
  }
}

function parseRSSFeed(text) {
  const regex = /<title>(.*?)<\/title>/g;
  const titles = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    titles.push(match[1]);
  }
  return titles;
}

async function postCommentToRSS(comment) {
  try {
    const content = await generateContent(prompts.commentReply.replace('"{comment}"', comment));
    await r.getComment(comment).reply(content);
    console.log('Replied to RSS feed comment:', comment);
  } catch (error) {
    console.error('Error posting comment to RSS feed:', error);
  }
}

cron.schedule('*/5 * * * *', () => {
  checkComments().catch(error => console.error('Error in scheduled comment check:', error));
});

cron.schedule('30 9 * * *', () => {
  postDailyContent().catch(error => console.error('Error in scheduled daily post:', error));
}, {
  scheduled: true,
  timezone: "America/Los_Angeles"
});

cron.schedule('0 10 * * *', () => {
  followUpOnComments().catch(error => console.error('Error in scheduled follow-up:', error));
}, {
  scheduled: true,
  timezone: "America/Los_Angeles"
});

cron.schedule('*/10 * * * *', () => {
  monitorRSSFeeds().catch(error => console.error('Error in scheduled RSS feed monitoring:', error));
});

export {
  checkComments,
  postComment,
  postDailyContent,
  followUpOnComments,
  monitorRSSFeeds
};
