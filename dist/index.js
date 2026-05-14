"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST"]
}));
app.use(express_1.default.json());
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
const rooms = {};
app.get("/", (req, res) => {
    res.json({ message: "hello manoj" });
});
app.post("/create-room", (req, res) => {
    console.log('reached-here');
    const roomId = `room_${Date.now()}`;
    rooms[roomId] = { countdown: 30, interval: null };
    res.json({ roomId });
});
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on("join-room", (roomId) => {
        if (!rooms[roomId]) {
            socket.emit("error", { message: "Room not found" });
            return;
        }
        socket.join(roomId);
        console.log(`${socket.id} joined ${roomId}`);
        rooms[roomId].countdown = 30;
        if (rooms[roomId].interval) {
            clearInterval(rooms[roomId].interval);
        }
        rooms[roomId].interval = setInterval(() => {
            const room = rooms[roomId];
            if (room.countdown <= 0) {
                clearInterval(room.interval);
                room.interval = null;
                io.to(roomId).emit("room-updated", { roomId, countdown: 0, status: "finished" });
                delete rooms[roomId];
                return;
            }
            io.to(roomId).emit("room-updated", {
                roomId,
                countdown: room.countdown,
                status: "active",
            });
            room.countdown--;
        }, 1000);
    });
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 3000;
httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
