const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const initSockets = require("./sockets");

connectDB();

const server = http.createServer(app);
const io = initSockets(server);

// Controllers emit real-time events through req.app.get("io")
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
