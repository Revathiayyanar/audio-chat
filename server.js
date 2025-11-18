// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ room, name }, cb) => {
    if (!rooms[room]) rooms[room] = new Map();
    rooms[room].set(socket.id, name);
    socket.join(room);

    // List of other participants in the room
    const otherUsers = Array.from(rooms[room].keys()).filter(id => id !== socket.id);
    cb({ success: true, otherUsers: otherUsers, yourId: socket.id });

    socket.to(room).emit('new-peer', { id: socket.id, name });
  });

  socket.on('offer', ({ to, offer }) => io.to(to).emit('offer', { from: socket.id, offer }));
  socket.on('answer', ({ to, answer }) => io.to(to).emit('answer', { from: socket.id, answer }));
  socket.on('ice-candidate', ({ to, candidate }) => io.to(to).emit('ice-candidate', { from: socket.id, candidate }));

  socket.on('leave-room', ({ room }) => leaveRoom(socket, room));

  socket.on('disconnect', () => {
    for (const room of Object.keys(rooms)) {
      if (rooms[room].has(socket.id)) leaveRoom(socket, room);
    }
  });

  function leaveRoom(socket, room) {
    if (!rooms[room]) return;
    rooms[room].delete(socket.id);
    socket.leave(room);
    socket.to(room).emit('peer-left', { id: socket.id });
    if (rooms[room].size === 0) delete rooms[room];
  }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
