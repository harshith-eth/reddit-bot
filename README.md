# Reddit Bot

Reddit Bot is an intelligent Reddit bot designed to promote Zavata.ai by posting engaging content about AI interviewers and the future of recruitment. The bot leverages the power of OpenAI's GPT models and Azure Communication Services to generate and post content, as well as send email reports.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Prompts](#prompts)
- [Advanced Usage](#advanced-usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Zavata Bot automates the process of posting on Reddit about Zavata.ai, a platform that revolutionizes the hiring process with AI-powered interviewers. The bot generates daily posts, replies to comments, and sends email reports about its activities.

## Features

- **Automated Reddit Posting**: Posts daily content on various subreddits about Zavata.ai.
- **Comment Monitoring and Replying**: Monitors Reddit comments and replies to relevant ones.
- **Email Notifications**: Sends detailed email reports about the bot's activities.
- **Customization**: Easily configurable prompts to generate diverse and engaging content.

## Installation

To install and run Zavata Bot, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/zavata-bot.git
    cd zavata-bot
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Set up environment variables**:
    Create a `.env` file in the root directory and add your configuration details:
    ```env
    CLIENT_ID=your_reddit_client_id
    CLIENT_SECRET=your_reddit_client_secret
    USER_AGENT=your_reddit_user_agent
    USERNAME=your_reddit_username
    PASSWORD=your_reddit_password
    AZURE_OPENAI_API_KEY=your_azure_openai_api_key
    AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
    AZURE_OPENAI_DEPLOYMENT=your_azure_openai_deployment
    EMAIL_CONNECTION_STRING=your_azure_communication_service_connection_string
    ```

## Configuration

Configure the bot by modifying the `config.js` file:

```javascript
require('dotenv').config();

const config = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  userAgent: process.env.USER_AGENT,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
  emailConnectionString: process.env.EMAIL_CONNECTION_STRING
};

module.exports = config;
