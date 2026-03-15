import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";

// Initialize SQLite database
const db = new Database("chat.db");

// Create messages table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId TEXT NOT NULL,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertMessage = db.prepare("INSERT INTO messages (gameId, userId, username, text) VALUES (?, ?, ?, ?)");
const getMessages = db.prepare("SELECT * FROM messages WHERE gameId = ? ORDER BY timestamp ASC LIMIT 100");

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_game", (gameId) => {
      socket.join(gameId);
      console.log(`User ${socket.id} joined game ${gameId}`);
      
      // Send previous messages
      try {
        const messages = getMessages.all(gameId);
        socket.emit("previous_messages", messages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    });

    socket.on("send_message", (data) => {
      const { gameId, userId, username, text } = data;
      
      try {
        // Save to DB
        const info = insertMessage.run(gameId, userId, username, text);
        
        const newMessage = {
          id: info.lastInsertRowid,
          gameId,
          userId,
          username,
          text,
          timestamp: new Date().toISOString()
        };
        
        // Broadcast to everyone in the game room
        io.to(gameId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    socket.on("leave_game", (gameId) => {
      socket.leave(gameId);
      console.log(`User ${socket.id} left game ${gameId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/messages/:gameId", (req, res) => {
    try {
      const messages = getMessages.all(req.params.gameId);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
