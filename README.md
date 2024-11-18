<a href="https://voice-thingy.vercel.app">
  <img alt="Voice Thingy" src="https://neon.tech/docs/og?title=Vm9pY2UgVGhpbmd5&amp;breadcrumb=QUk=">  
</a>

<a href="https://voice-thingy.vercel.app">
  <h1 align="center">Voice Thingy</h1>
</a>

<p align="center">
  An open source tool - converse with AI in audio. Powered by OpenAI Realtime, Braintrust & Neon.
</p>

## Tech stack

- [Neon](https://neon.tech/) for storing conversation history
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime/realtime-api-beta) on [Braintrust](https://www.braintrust.dev/blog/realtime-api) for audio conversation powered by AI
- [Next.js](https://nextjs.org/) with TypeScript for the app framework
- [Tailwind](https://tailwindcss.com/) for styling

## Cloning & running

1. Clone the repo: `git clone https://github.com/neondatabase-labs/voice-thingy`
2. Create a `.env` file and add the following environment variables:

```
# Grab a connection string from https://console.neon.tech
DATABASE_URL="postgresql://neondb_owner:...@ep-...us-east-1.aws.neon.tech/neondb?sslmode=require"

# Grab API Key from https://www.braintrust.dev/app/settings/api-keys
BRAINTRUST_API_KEY="sk-xlKWNORh5P4zOneLDeYq78VQqed9WBmIKSHddl7WDbHXh107"
```

3. In [Braintrust's Settings](https://www.braintrust.dev/app/settings/secrets), set your `OPENAI_API_KEY`.
4. Run `pnpm install` and `pnpm schema` to install dependencies and set the relevant schema in your Neon database.
5. Run `pnpm dev` to run the application locally.
