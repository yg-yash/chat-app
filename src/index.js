const path = require("path");
//we are gonna need http library in order to use express in a different way so that societ .io can be used
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketIO(server); //thats why we created server on our own

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "../public");

//serving static public folder
app.use(express.static(publicDir));

io.on("connection", socket => {
  console.log("new web socket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} Has Joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  socket.on("sendLocation", (position, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",

      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${position.latitude},${position.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`server is up on ${PORT}`);
});
