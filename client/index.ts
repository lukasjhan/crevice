import WebSocket from 'ws';
import crypto from 'crypto';
import readline from 'readline';

const baseUrl: string = 'ws://localhost:5000';

const roomId: string | undefined = process.argv[2];
const url: string = roomId ? `${baseUrl}?roomId=${roomId}` : baseUrl;

const ws: WebSocket = new WebSocket(url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ecdh = crypto.createECDH('prime256v1');
const publicKey = ecdh.generateKeys('base64', 'compressed');

let sharedKey: Buffer | null = null;
let receivedPublicKey: boolean = false;
let sentPublicKey: boolean = false;

function encryptMessage(message: string): string {
  if (!sharedKey) throw new Error('Shared key not established');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    sharedKey.subarray(0, 32),
    iv
  );
  let encrypted = cipher.update(message, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('base64'),
    encryptedData: encrypted,
    authTag: authTag.toString('base64'),
  });
}

function decryptMessage(encryptedMsg: string): string {
  if (!sharedKey) throw new Error('Shared key not established');
  const { iv, encryptedData, authTag } = JSON.parse(encryptedMsg);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    sharedKey.slice(0, 32),
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function isKeyExchangeComplete(): boolean {
  return receivedPublicKey && sentPublicKey;
}

ws.on('open', function open(): void {
  console.log('서버에 연결되었습니다.');
});

ws.on('message', function incoming(data: WebSocket.Data): void {
  const message = data.toString();
  try {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === 'publicKey') {
      sharedKey = ecdh.computeSecret(parsedMessage.key, 'base64');
      receivedPublicKey = true;
      console.log('상대방의 공개키를 받았습니다.');
      if (!sentPublicKey) {
        ws.send(JSON.stringify({ type: 'publicKey', key: publicKey }));
        sentPublicKey = true;
        console.log('공개키를 보냈습니다.');
      }
      if (isKeyExchangeComplete()) {
        console.log('키 교환이 완료되었습니다. 메시지를 입력해주세요:');
        promptUser();
      }
    } else if (parsedMessage.type === 'encryptedMessage') {
      const decryptedMessage = decryptMessage(parsedMessage.content);
      console.log('\n상대방: ' + decryptedMessage);
      promptUser();
    }
  } catch (error) {
    if (message === '[ready]') {
      console.log('상대방이 연결되었습니다. 키 교환을 시작합니다.');
      ws.send(JSON.stringify({ type: 'publicKey', key: publicKey }));
      sentPublicKey = true;
      console.log('공개키를 보냈습니다.');
    } else if (message.startsWith('방 ID:')) {
      console.log(message);
    } else if (message === '[end]') {
      console.log('방 종료');
      rl.close();
      ws.close();
      process.exit(0);
    } else {
      console.log('처리되지 않은 메시지:', message);
    }
  }
});

ws.on('close', function close(): void {
  console.log('서버와의 연결이 종료되었습니다.');
  rl.close();
});

ws.on('error', function error(err: Error): void {
  console.error('WebSocket 오류 발생:', err);
  rl.close();
});

function promptUser(): void {
  rl.question('메시지 입력 (종료하려면 "quit" 입력): ', (input) => {
    if (input.toLowerCase() === 'quit') {
      console.log('채팅을 종료합니다.');
      ws.close();
      rl.close();
    } else if (isKeyExchangeComplete()) {
      const encryptedMessage = encryptMessage(input);
      ws.send(
        JSON.stringify({ type: 'encryptedMessage', content: encryptedMessage })
      );
      console.log('나: ' + input);
      promptUser();
    } else {
      console.log('키 교환이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.');
      promptUser();
    }
  });
}
