# Application Configuration (`app-config.model.ts` / `app-config.json`)

This document describes the structure and purpose of the application configuration model, as defined in `src/model/app-config.model.ts` and represented in the `app-config.json` file. **Do not include or commit actual secret values.**

---

## Overview

The application configuration centralizes all environment-specific and sensitive settings for the server. The configuration is defined by the `IAppConfig` TypeScript interface and is typically provided via the `app-config.json` file.

---

## Configuration Structure

### Root Object: `IAppConfig`

| Property                  | Type                    | Description                                                            |
|---------------------------|-------------------------|------------------------------------------------------------------------|
| openAiConfig              | `OpenAiConfig`          | OpenAI API configuration (organization and API key).                   |
| mongo                     | `MongoConfig`           | MongoDB connection settings.                                           |
| tokenSecret               | `string`                | Secret used for JWT token generation and validation.                   |
| corsAllowed               | `string[]` (optional)   | List of allowed origins for CORS.  Used primarily for running locally. |
| serverConfig              | `ServerConfig`          | Server-specific configuration (e.g., port).                            |
| chatSocketIoEndpoint      | `string`                | Full URL to the Socket.IO endpoint for chat.                           |
| chatSocketIoPath          | `string`                | Path for the Socket.IO connection (not the namespace).                 |
| tavilyConfiguration       | `TavilyConfiguration`   | Tavily API configuration.                                              |

#### Example (with placeholder values):

```json
{
  "openAiConfig": {
    "openAiOrg": "<your-openai-org>",
    "openAiKey": "<your-openai-api-key>"
  },
  "mongo": {
    "connectionString": "<your-mongodb-connection-string>",
    "databaseName": "<your-database-name>"
  },
  "tokenSecret": "<your-token-secret>",
  "corsAllowed": [
    "http://localhost:4200"
  ],
  "serverConfig": {
    "port": 3000
  },
  "chatSocketIoEndpoint": "ws://localhost:3000/",
  "chatSocketIoPath": "/chat-io",
  "tavilyConfiguration": {
    "apiKey": "<your-tavily-api-key>"
  }
}
```

---

## Sub-Objects

### `OpenAiConfig`

| Property    | Type   | Description                                                 |
|-------------|--------|-------------------------------------------------------------|
| openAiOrg   | string | OpenAI organization ID.  NOTE: This is probably not needed, but the entry is (even if blank). |
| openAiKey   | string | OpenAI API key.                                             |

---

### `MongoConfig`

| Property         | Type   | Description                 |
|------------------|--------|-----------------------------|
| connectionString | string | MongoDB connection URI.     |
| databaseName     | string | Name of the main database.  |

---

### `ServerConfig`

| Property | Type   | Description         |
|----------|--------|---------------------|
| port     | number | Port for the server |

---

### `TavilyConfiguration`

| Property | Type   | Description      |
|----------|--------|------------------|
| apiKey   | string | Tavily API key   |

---

## Additional Notes

- **Sensitive Values:** Do not commit actual secrets (API keys, connection strings, token secrets) to version control.
- **Extensibility:** The config file may include additional sections for other services (e.g., `langChain`). These should follow a similar nested structure.
- **Usage:** The configuration is loaded at application startup and injected where needed.
