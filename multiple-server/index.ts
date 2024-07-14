import { serve } from 'bun';
import Redis from 'ioredis';
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

const ROOM_TTL = 30; // 30 seconds
const SERVER_ID = uuidv4();

const redis = new Redis();
let rabbitmqChannel: amqp.Channel;

const rooms = new Map();
const clients = new Map();

async function setupRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  rabbitmqChannel = await connection.createChannel();
  await rabbitmqChannel.assertQueue(SERVER_ID);

  rabbitmqChannel.consume(SERVER_ID, (msg) => {
    if (msg !== null) {
      const { roomId, message } = JSON.parse(msg.content.toString());
      const clientsInRoom = rooms.get(roomId);
      if (clientsInRoom) {
        for (const client of clientsInRoom) {
          client.send(message);
        }
      }
      rabbitmqChannel.ack(msg);
    }
  });
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

async function getServerIdsForRoom(roomId: string): Promise<string[]> {
  const serverIds = await redis.smembers(`room:${roomId}:servers`);
  return serverIds;
}

async function addServerToRoom(roomId: string): Promise<number> {
  const added = await redis.sadd(`room:${roomId}:servers`, SERVER_ID);
  await redis.expire(`room:${roomId}:servers`, ROOM_TTL);
  return added;
}

async function removeServerFromRoom(roomId: string): Promise<number> {
  const removed = await redis.srem(`room:${roomId}:servers`, SERVER_ID);
  const remaining = await redis.scard(`room:${roomId}:servers`);
  if (remaining === 0) {
    await redis.del(`room:${roomId}:servers`);
  }
  return removed;
}

const server = serve({
  port: 5001,
  fetch(req, server) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('roomId');

    if (server.upgrade(req, { data: { roomId } })) {
      return;
    }
    return new Response('Upgrade failed', { status: 500 });
  },
  websocket: {
    async open(ws: any) {
      const roomId = ws.data.roomId || generateRoomId();

      const serverIds = await getServerIdsForRoom(roomId);
      if (serverIds.length >= 2) {
        console.debug(`${roomId} room is full`);
        ws.close();
        return;
      }

      await addServerToRoom(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(ws);
      clients.set(ws, roomId);

      console.debug(
        `client connected to room ${roomId} on server ${SERVER_ID}`
      );

      if (serverIds.length === 0) {
        ws.send(JSON.stringify({ type: 'system', message: roomId }));
      } else if (serverIds.length === 1) {
        const [firstClient, secondClient] = rooms.get(roomId);
        firstClient.send(JSON.stringify({ type: 'system', message: 'ready' }));
      }
    },
    async message(ws, message) {
      const roomId = clients.get(ws);
      console.debug(`room ${roomId} message: ${message}`);

      const serverIds = await getServerIdsForRoom(roomId);
      const otherServerId = serverIds.find((id) => id !== SERVER_ID);

      if (otherServerId) {
        // Send message to other server via RabbitMQ
        rabbitmqChannel.sendToQueue(
          otherServerId,
          Buffer.from(JSON.stringify({ roomId, message }))
        );
      } else {
        // Both connections are on this server, handle locally
        if (rooms.has(roomId)) {
          for (const client of rooms.get(roomId)) {
            if (client !== ws) {
              client.send(message);
            }
          }
        }
      }
    },
    async close(ws) {
      const roomId = clients.get(ws);
      console.debug(`client disconnected from room ${roomId}`);

      await removeServerFromRoom(roomId);

      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
          console.debug(`room ${roomId} deleted on server ${SERVER_ID}`);
        } else {
          for (const client of rooms.get(roomId)) {
            client.send(JSON.stringify({ type: 'system', message: 'end' }));
          }
        }
      }
      clients.delete(ws);
    },
  },
});

setupRabbitMQ().then(() => {
  console.debug(
    `WebSocket server ${SERVER_ID} running on http://localhost:${server.port}`
  );
});
