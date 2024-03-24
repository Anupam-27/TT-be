const dotenv = require("dotenv");
dotenv.config();
const express = require('express')
const cors = require("cors")
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const http = require('http');
const { Server } = require('socket.io');
const redis = require('./utils/redis');
const exportFuns = require('./middleware/validateRequest');
const model = require("./model");
const Users = model.users;
const jwt = require("jsonwebtoken");
const { TransactionScheduler } = require("./utils/scheduler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FE_URL,
    },
});

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true
}

app.use(cors(corsOptions))
app.use(cookieParser())

app.use(bodyParser.json());

app.use("/", require("./routes"));

io.use(async (socket, next) => {
    try {
        const sessionID = socket.handshake.auth.sessionID;
        if (sessionID) {
            // find existing session
            const isTokenExistsInCache = await redis.getToken(sessionID)
            if (isTokenExistsInCache) {
                const data = jwt.verify(sessionID, process.env.JWT_SECRET_KEY);
                const userObj = await Users.findOne({
                    where: {
                        id: data.user.id
                    }
                })
                if (userObj) {
                    socket.sessionID = sessionID;
                    socket.userID = data.user.id;
                    next();
                } else {
                    next(new Error("invalid username"));
                }
            }
            // next();
        }
    } catch (err) {
        console.log(err, "set socket token")
        return next(new Error("something went wrong!"));
    }
});

io.on("connection", (socket) => {
    try {
        const socketController = require("./controllers/socket.controller")
        socketController.initialiseSocket(socket)

        socket.emit("session", {
            sessionID: socket.sessionID,
            userID: socket.userID,
        });
        socket.join(socket.userID);
        console.log(socket.userID, "userID")

        socket.on("connect_error", (data) => {
            console.log(data);
        });

        socket.on("update_score", (data) => {
            socketController.handleScoreUpdate(data)
        })
        socket.on("start_set", (data) => {
            console.log(socket, "socket")
            socketController.handleStartSet(data)
        })
        socket.on("finish_set", (data) => {
            socketController.handleFinishSet(data)
        })
        socket.on("finish_match", (data) => {
            socketController.handleFinishMatch(data)
        })
    } catch (err) {
        console.log(err, "connection")
    }
})
// console.log(io.sockets.connected, "users")

TransactionScheduler()

const PORT = process.env.PORT || 8080
console.log(PORT)
server.listen(PORT, () => {
    console.log("server started")
})

process.on("unhandledRejection", (err) =>
    console.log("unhandledRejection", err)
);
process.on("uncaughtException", (err) => console.log("uncaughtException", err));