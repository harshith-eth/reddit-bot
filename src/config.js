require('dotenv').config();

const config = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  userAgent: process.env.USER_AGENT,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIDeployment: process.env.AZURE_OPENAI_DEPLOYMENT
};

module.exports = config;