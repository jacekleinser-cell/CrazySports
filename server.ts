import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import { Resend } from "resend";
import crypto from "crypto";

// Initialize SQLite database
const db = new Database("chat.db");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId TEXT NOT NULL,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    token TEXT
  );
  
  CREATE TABLE IF NOT EXISTS auth_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    username TEXT,
    expires_at DATETIME NOT NULL
  );
`);

const insertMessage = db.prepare("INSERT INTO messages (gameId, userId, username, text) VALUES (?, ?, ?, ?)");
const getMessages = db.prepare("SELECT * FROM messages WHERE gameId = ? ORDER BY timestamp ASC LIMIT 100");

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // 5-minute cleanup job
  setInterval(() => {
    try {
      // Delete messages older than 5 minutes
      const info = db.prepare(`DELETE FROM messages WHERE timestamp <= datetime('now', '-5 minutes')`).run();
      if (info.changes > 0) {
        io.emit("messages_cleaned");
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  }, 10000); // Check every 10 seconds

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

  // Auth Endpoints
  app.post("/api/auth/login", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });

    try {
      let user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as any;
      const token = crypto.randomBytes(16).toString('hex');

      if (user) {
        db.prepare(`UPDATE users SET token = ? WHERE username = ?`).run(token, username);
      } else {
        const id = crypto.randomUUID();
        // Generate a fake email for the database constraint if it exists
        const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
        try {
          db.prepare(`INSERT INTO users (id, email, username, token) VALUES (?, ?, ?, ?)`).run(id, email, username, token);
        } catch (e) {
            // If email is not unique (unlikely with this generation, but possible), just append a random string
            const fallbackEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 10000)}@example.com`;
            db.prepare(`INSERT INTO users (id, email, username, token) VALUES (?, ?, ?, ?)`).run(id, fallbackEmail, username, token);
        }
        user = { id, email, username };
      }

      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
      const user = db.prepare(`SELECT id, email, username FROM users WHERE token = ?`).get(token);
      if (!user) return res.status(401).json({ error: "Invalid token" });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/messages/:gameId", (req, res) => {
    try {
      const messages = getMessages.all(req.params.gameId);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // MLB Proxy Endpoints to avoid CORS
  app.get("/api/mlb/scores", async (req, res) => {
    try {
      const dateParam = req.query.date ? `&date=${req.query.date}` : '';
      const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=team,linescore${dateParam}`);
      if (!response.ok) throw new Error("MLB API failed");
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("MLB Proxy Error:", err);
      res.status(500).json({ error: "Failed to fetch MLB scores" });
    }
  });

  app.get("/api/mlb/standings", async (req, res) => {
    try {
      const response = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104`);
      if (!response.ok) throw new Error("MLB API failed");
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("MLB Proxy Error:", err);
      res.status(500).json({ error: "Failed to fetch MLB standings" });
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
