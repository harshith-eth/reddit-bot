// Import required modules
const Snoowrap = require('snoowrap'); // Snoowrap is a library for accessing the Reddit API
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai"); // Importing Azure OpenAI client for accessing the OpenAI API
const cron = require('node-cron'); // Node-cron is a library for scheduling tasks in Node.js
const { EmailClient } = require("@azure/communication-email"); // Azure Communication Email SDK
const config = require('./config'); // Importing configuration settings from config.js
const prompts = require('./prompts'); // Importing predefined prompts from prompts.js

// Initialize the Reddit API client with credentials from config.js
const r = new Snoowrap({
  userAgent: config.userAgent,
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  username: config.username,
  password: config.password,
});

// Initialize the OpenAI client with Azure credentials from config.js
const openAIClient = new OpenAIClient(
  config.azureOpenAIEndpoint,
  new AzureKeyCredential(config.azureOpenAIApiKey)
);

// Initialize Azure Communication Email client
const connectionString = "endpoint=https://cold-email.unitedstates.communication.azure.com/;accesskey=84kDQsyzaA0rG8gKcUZ3mgG3PIShtn0pK6v7Il7Q3yoWXrMb53c1JQQJ99AGACULyCpqMMGeAAAAAZCSDnQW";
const emailClient = new EmailClient(connectionString);

// Function to send a well-structured email notification
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

// Function to check new comments on Reddit
async function checkComments() {
  try {
    const comments = await r.getNewComments('all', { limit: 25 });
    for (const comment of comments) {
      if (comment.body.toLowerCase().includes('ai interviewer')) {
        await postComment(comment);
      }
    }
  } catch (error) {
    console.error('Error checking comments:', error);
  }
}

// Function to post a reply to a comment
async function postComment(comment) {
  try {
    const content = await generateContent(prompts.commentReply.replace('"{comment.body}"', comment.body));
    await comment.reply(content);
    console.log('Replied to comment:', comment.id);
  } catch (error) {
    console.error('Error posting comment:', error);
  }
}

// Function to generate content using OpenAI
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

// Function to post daily content on Reddit
async function postDailyContent() {
  try {
    const subreddits = ['test', 'microsaas', 'saas', 'micro_saas', 'salesforce', 'jobsearchhacks', 'careerguidance', 'humanresources',
      'startups', 'entrepreneur', 'WorkOnline', 'ProductManagement', 'remotework','TalentAcquisition','DataScienceJobs','cscareerquestions','IndieHackers','SideProject','ProductHunters','Leadership','DeepLearning','DevOpsJobs','ITJobs','SysAdminJobs','SmallBusiness','B2B','RecruitmentMarketing','EmployerBranding','microsaas','zavataai','AIRecruitment','SaaSInnovations','JobSeekerAI','startup_ideas','venturecapital','TechStartups','Fintech','HealthTech','EdTech','LegalTech','LegalTechAI','Consulting','ITCareerQuestions','TechNews'];
    
    const title = 'AI Interviewers and the Future of Recruiting with Zavata.ai';
    const content = await generateContent(prompts.dailyPost);

    let successfulPosts = [];
    let failedPosts = [];

    for (const subreddit of subreddits) {
      try {
        await r.getSubreddit(subreddit).submitSelfpost({ title, text: content });
        console.log(`Daily post submitted successfully in subreddit: ${subreddit}`);
        successfulPosts.push(subreddit);
      } catch (error) {
        console.error(`Error submitting daily post to subreddit ${subreddit}:`, error);
        failedPosts.push({ subreddit, error: error.message });
      }
    }

    // Email report with all successful and failed posts
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

// Function to follow up on specific comments
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

// Schedule comment checking every 5 minutes
cron.schedule('*/5 * * * *', () => {
  checkComments().catch(error => console.error('Error in scheduled comment check:', error));
});

// Schedule daily post at 9:30 AM PST
cron.schedule('30 9 * * *', () => {
  postDailyContent().catch(error => console.error('Error in scheduled daily post:', error));
}, {
  scheduled: true,
  timezone: "America/Los_Angeles"
});

// Schedule follow-up on specific comments
cron.schedule('0 10 * * *', () => {
  followUpOnComments().catch(error => console.error('Error in scheduled follow-up:', error));
}, {
  scheduled: true,
  timezone: "America/Los_Angeles"
});

module.exports = {
  checkComments,
  postComment,
  postDailyContent,
  followUpOnComments
};
