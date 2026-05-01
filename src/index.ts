import 'reflect-metadata'; // Must be the very first import — loads before any @injectable class
import { buildContainer } from './container';
import { TOKENS } from './tokens';
import { getAppConfig } from './config';
import { SocketServer } from './server/socket.server';
import { initializeExpressApp } from './setup-express';
import { systemInitialization } from './system-setup';
import http from 'http';

async function run() {
    const container = await buildContainer();
    const config = await getAppConfig();

    // Eagerly resolve socket-dependent services so their initialize() calls run at startup.
    // ChattingService and VoiceChatService both register socket event handlers on construction.
    await container.getAsync(TOKENS.ChattingService);
    await container.getAsync(TOKENS.VoiceChatService);

    const app = await initializeExpressApp(container);
    const server = http.createServer(app);

    const socketServer = await container.getAsync<SocketServer>(TOKENS.SocketServer);
    socketServer.registerWithServer(config, server);

    await systemInitialization(container);

    const port = config.serverConfig.port;
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

run();
