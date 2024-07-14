import { CreviceClient } from './crevice.client';
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
