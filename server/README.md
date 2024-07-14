# Crevice(server)

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

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## 📦 Docker

To run Crevice using Docker:

1. Build the Docker image:

   ```
   docker build -t crevice .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 crevice
   ```
