# Crevice(client)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-4E4E4E?style=for-the-badge&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

Crevice is a lightweight, high-performance WebSocket service for secure 1:1 real-time communication with end-to-end encryption, capable of handling large data volumes.

## 🚀 Features

- **Lightweight**: Optimized for minimal resource usage
- **High Performance**: Built with Bun and Node.js for blazing-fast execution
- **Secure**: End-to-end encryption for all communications
- **Real-time**: Instant message delivery using WebSocket
- **Scalable**: Designed to handle large volumes of data
- **1:1 Communication**: Focused on private, direct messaging
- **Batteries Included**: Includes a client for easy integration

## 🔧 Usage

To run the client:

```bash
cd client
```

Install dependencies:

```bash
pnpm install
```

Start the client:

```bash
pnpm test
```

```bash
pnpm test [roomId]
```

If you want to join a room, you can specify the room ID as an argument.

## SDK

The client SDK is available as a separate package. To install the SDK:

```bash
pnpm install crevice-client
```

You can use the SDK as follows:

```typescript
import { CreviceClient } from '../src/crevice.client';
import readline from 'readline';

const baseUrl: string = 'ws://localhost:5000';
const roomId: string | undefined = process.argv[2];

const onRoomCreated = (roomId: string) => {
  console.log('Room created:', roomId);
  promptUser();
};

const onOpen = (roomId: string) => {
  console.log('Connection established:', roomId);
  promptUser();
};

const onError = (error: Error) => {
  console.error('Connection error:', error);
};

const onClose = () => {
  console.log('Connection closed');
  rl.close();
};

const client = new CreviceClient(
  baseUrl,
  (message: string) => {
    console.log('Remote message:', message);
    promptUser();
  },
  {
    roomId,
    roomCreatedCallback: onRoomCreated,
    openCallback: onOpen,
    errorCallback: onError,
    closeCallback: onClose,
  }
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptUser(): void {
  rl.question('> (quit to exit)', (input) => {
    if (input.toLowerCase() === 'quit') {
      console.log('Exiting...');
      client.close();
      rl.close();
    } else {
      try {
        client.send(input);
        console.log('You: ' + input);
        promptUser();
      } catch (error) {
        console.error('Message sending error:', error);
        promptUser();
      }
    }
  });
}

console.log('Connecting to server...');
```
