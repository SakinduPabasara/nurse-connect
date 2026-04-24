const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

module.exports = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
    });

    // Authenticate socket connection
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }
        
        socket.user = user;
        next();
      } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      // console.log(`Socket connected: ${socket.id} (User: ${socket.user._id})`);
      
      // Join a private room for this user to receive direct notifications
      socket.join("user:" + socket.user._id.toString());
      
      // Global and role-based rooms
      socket.join("all_users");
      if (socket.user.role === 'admin') {
        socket.join("admin");
      }

      socket.on("disconnect", () => {
        // console.log(`Socket disconnected: ${socket.id} (User: ${socket.user._id})`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
