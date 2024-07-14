import WebSocket from 'ws';
import crypto from 'crypto';

type MessageType =
  | { type: 'system'; message: 'ready' | 'end' | string }
  | { type: 'publicKey'; key: string }
  | { type: 'encryptedMessage'; content: string };

type RoomCreatedCallback = (roomId: string) => void;
type OpenCallback = (roomId: string) => void;
type MessageCallback = (message: string) => void;
type ErrorCallback = (error: Error) => void;
type CloseCallback = () => void;

export class CreviceClient {
  private ws: WebSocket;
  private ecdh: crypto.ECDH;
  private publicKey: string;
  private sharedKey: Buffer | null = null;
  private roomId: string | null = null;

  private receivedPublicKey: boolean = false;
  private sentPublicKey: boolean = false;

  private roomCreatedCallback: RoomCreatedCallback | null = null;
  private openCallback: OpenCallback | null = null;
  private messageCallback: MessageCallback;
  private errorCallback: ErrorCallback | null = null;
  private closeCallback: CloseCallback | null = null;

  constructor(
    baseUrl: string,
    messageCallback: MessageCallback,
    options?: {
      roomId?: string;
      roomCreatedCallback?: RoomCreatedCallback;
      openCallback?: OpenCallback;
      errorCallback?: ErrorCallback;
      closeCallback?: CloseCallback;
    }
  ) {
    this.messageCallback = messageCallback;

    if (options?.roomId) this.roomId = options.roomId;
    if (options?.roomCreatedCallback)
      this.roomCreatedCallback = options.roomCreatedCallback;
    if (options?.openCallback) this.openCallback = options.openCallback;
    if (options?.errorCallback) this.errorCallback = options.errorCallback;
    if (options?.closeCallback) this.closeCallback = options.closeCallback;

    const url: string = this.roomId
      ? `${baseUrl}?roomId=${this.roomId}`
      : baseUrl;
    this.ws = new WebSocket(url);
    this.ecdh = crypto.createECDH('prime256v1');
    this.publicKey = this.ecdh.generateKeys('base64', 'compressed');
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.ws.on('message', (data) => this.handleMessage(data));
    this.ws.on('error', (error) => this.handleError(error));
    this.ws.on('close', () => this.handleClose());
  }

  private encryptMessage(message: string): string {
    if (!this.sharedKey) throw new Error('Shared key not established');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.sharedKey.subarray(0, 32),
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

  private decryptMessage(encryptedMsg: string): string {
    if (!this.sharedKey) throw new Error('Shared key not established');
    const { iv, encryptedData, authTag } = JSON.parse(encryptedMsg);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.sharedKey.subarray(0, 32),
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as MessageType;
      switch (message.type) {
        case 'system':
          this.handleSystemMessage(message);
          break;
        case 'publicKey':
          this.handlePublicKeyMessage(message);
          break;
        case 'encryptedMessage':
          this.handleEncryptedMessage(message);
          break;
        default:
          throw new Error('Invalid message type');
      }
    } catch (error: unknown) {
      this.errorCallback?.(
        error instanceof Error ? error : new Error(error as string | undefined)
      );
    }
  }

  private handleSystemMessage(message: {
    type: 'system';
    message: 'ready' | 'end' | string;
  }): void {
    switch (message.message) {
      case 'ready': {
        this.ws.send(
          JSON.stringify({ type: 'publicKey', key: this.publicKey })
        );
        this.sentPublicKey = true;
        break;
      }
      case 'end': {
        this.close();
        break;
      }

      default:
        this.roomId = message.message;
        this.roomCreatedCallback?.(this.roomId);
        break;
    }
  }

  private handlePublicKeyMessage(message: {
    type: 'publicKey';
    key: string;
  }): void {
    this.sharedKey = this.ecdh.computeSecret(message.key, 'base64');
    this.receivedPublicKey = true;
    if (!this.sentPublicKey) {
      this.ws.send(JSON.stringify({ type: 'publicKey', key: this.publicKey }));
      this.sentPublicKey = true;
    }

    if (this.isInitialized() && this.roomId) {
      this.openCallback?.(this.roomId);
    }
  }

  private handleEncryptedMessage(message: {
    type: 'encryptedMessage';
    content: string;
  }): void {
    const decryptedMessage = this.decryptMessage(message.content);
    this.messageCallback(decryptedMessage);
  }

  private sendMessage(message: MessageType): void {
    this.ws.send(JSON.stringify(message));
  }

  private handleError(error: Error): void {
    this.errorCallback?.(error);
  }

  private handleClose(): void {
    this.closeCallback?.();
  }

  public isInitialized(): boolean {
    return this.receivedPublicKey && this.sentPublicKey && !!this.sharedKey;
  }

  public close(): void {
    this.ws.close();
  }

  public onOpen(callback: OpenCallback): void {
    this.openCallback = callback;
  }

  public onMessage(callback: MessageCallback): void {
    this.messageCallback = callback;
  }

  public onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  public onClose(callback: CloseCallback): void {
    this.closeCallback = callback;
  }

  public send(message: string): void {
    if (this.sharedKey) {
      const encryptedMessage = this.encryptMessage(message);
      this.sendMessage({ type: 'encryptedMessage', content: encryptedMessage });
    } else {
      throw new Error('Cannot send message: key exchange not completed');
    }
  }
}
