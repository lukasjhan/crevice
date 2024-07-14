# Crevice

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

## 🛠️ Installation

Ensure you have [Bun](https://bun.sh/) installed on your system.

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/crevice.git
   ```

2. Navigate to the project directory:

   ```
   cd server
   ```

3. Install dependencies:
   ```
   bun install
   ```

## 🔧 Usage

### Server

To start the Crevice server:

```
bun run start
```

For development with hot reloading:

```
bun run dev
```

If you want to see the details, check the [server README](server/README.md).

### Client

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

If you want to see the details, check the [client README](client/README.md).

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

## 🔒 Security

Crevice uses state-of-the-art encryption methods to ensure the privacy and integrity of your communications. All messages are encrypted end-to-end, meaning only the intended recipients can read them.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For any queries or support, please open an issue in the GitHub repository.
