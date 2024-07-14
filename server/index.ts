import { serve } from 'bun';

const rooms = new Map();
const clients = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

const server = serve({
  port: 5000,
  fetch(req, server) {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('roomId');

    if (server.upgrade(req, { data: { roomId } })) {
      return;
    }
    return new Response('Upgrade failed', { status: 500 });
  },
  websocket: {
    open(ws: any) {
      const roomId = ws.data.roomId || generateRoomId();

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
        console.debug(`new room: ${roomId}`);
        ws.send(JSON.stringify({ type: 'system', message: roomId }));
      } else if (rooms.get(roomId).size >= 2) {
        console.debug(`${roomId} room is full`);
        ws.close();
        return;
      }

      rooms.get(roomId).add(ws);
      clients.set(ws, roomId);

      console.debug(`client connected to room ${roomId}`);

      if (rooms.get(roomId).size === 2) {
        const [firstClient, secondClient] = rooms.get(roomId);
        firstClient.send(JSON.stringify({ type: 'system', message: 'ready' }));
      }
    },
    message(ws, message) {
      const roomId = clients.get(ws);
      console.debug(`room ${roomId} message: ${message}`);

      if (rooms.has(roomId)) {
        for (const client of rooms.get(roomId)) {
          if (client !== ws) {
            client.send(message);
          }
        }
      }
    },
    close(ws) {
      const roomId = clients.get(ws);
      console.debug(`client disconnected from room ${roomId}`);

      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
          console.debug(`room ${roomId} deleted`);
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

console.debug(`WebSocket server running on http://localhost:${server.port}`);
