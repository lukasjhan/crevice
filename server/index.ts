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
        console.log(`새로운 방 생성: ${roomId}`);
        ws.send(JSON.stringify({ type: 'system', message: roomId }));
      } else if (rooms.get(roomId).size >= 2) {
        console.log(`${roomId} 방은 이미 가득 찼습니다.`);
        ws.close();
        return;
      }

      rooms.get(roomId).add(ws);
      clients.set(ws, roomId);

      console.log(`클라이언트가 방 ${roomId}에 연결되었습니다.`);

      if (rooms.get(roomId).size === 2) {
        const [firstClient, secondClient] = rooms.get(roomId);
        firstClient.send(JSON.stringify({ type: 'system', message: 'ready' }));
      }
    },
    message(ws, message) {
      const roomId = clients.get(ws);
      console.log(`방 ${roomId}에 메시지 전송: ${message}`);

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
      console.log(`클라이언트가 방 ${roomId}에서 연결 해제되었습니다.`);

      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
          console.log(`방 ${roomId} 삭제됨`);
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

console.log(
  `WebSocket 서버가 http://localhost:${server.port}에서 실행 중입니다.`
);
