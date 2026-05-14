import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms: Record<string, { countdown: number; interval: NodeJS.Timeout | null; status?: 'Started' | 'Finished' }> = {};

app.get("/", (req, res) => {
  res.json({ message: "hello manoj" });
});

app.post("/create-room", (req, res) => {
  console.log('reached-here');

  const roomId = `room_${Date.now()}`;
  rooms[roomId] = { countdown: 30, interval: null };
  res.json({ roomId });
});

io.on("connection", (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  // socket.on("join-room", (roomId: string) => {
  //   if (!rooms[roomId]) {
  //     socket.emit("error", { message: "Room not found" });
  //     return;
  //   }

  //   socket.join(roomId);
  //   console.log(`${socket.id} joined ${roomId}`);

  //   rooms[roomId].countdown = 30;

  //   if (rooms[roomId].interval) {
  //     clearInterval(rooms[roomId].interval!);
  //   }

  //   rooms[roomId].interval = setInterval(() => {
  //     const room = rooms[roomId];

  //     if (room.countdown <= 0) {
  //       clearInterval(room.interval!);
  //       room.interval = null;
  //       io.to(roomId).emit("room-updated", { roomId, countdown: 0, status: "finished" });
  //       delete rooms[roomId];
  //       return;
  //     }

  //     io.to(roomId).emit("room-updated", {
  //       roomId,
  //       countdown: room.countdown,
  //       status: "active",
  //     });

  //     room.countdown--;
  //   }, 1000);
  // });

  socket.on("join-room", (roomId: string) => {
    if (rooms[roomId]) return

    socket.join(roomId)

    const room: { countdown: number; interval: NodeJS.Timeout | null; status: 'Started' | 'Finished' } = rooms[roomId]

    if (!room) return

    if (room.interval) {
      clearInterval(room.interval)
    }

    room.countdown = 30

    room.status = "Started"

    const curInterval = setInterval(() => {

      room.countdown--

      if (room.countdown <= 0) {
        clearInterval(curInterval)
        room.status = 'Finished'
        io.to(roomId).emit('room-updated', room)
      }

      io.to(roomId).emit('room-updated', room)

    }, 1000);

  })

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});