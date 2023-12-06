const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const axios = require('axios');

const app = express();

const port = process.env.PORT || 3000;
var server = http.createServer(app);
const Room = require("./models/room");
var io = require("socket.io")(server);

const DB = "mongodb+srv://shoaibstudent72:Rukhsana12@cluster0.eetu2gm.mongodb.net/";
io.on("connection", (socket) => {
    console.log('Connected !');
    socket.on("createRoom", async ({ nickname }) => {
        console.log(nickname);
        try {
            let room = new Room(); //first create an instance of it
            let player = {
                socketID: socket.id,
                nickname: nickname,
                playerType: 'X'
            };
            room.players.push(player); //we are adding it 
            room.turn = player;
            room = await room.save(); //then save that object
            const roomId = room._id.toString(); //we get room id in return
            socket.join(roomId); // the host join the socket with room id
            io.to(roomId).emit("createRoomSuccess", room); //those who are connected to room id will get connected
        }
        catch (e) {
            console.log('The room has been created')
        }

    });
    socket.on("joinRoom", async ({ nickname, roomId }) => {
        console.log(nickname, roomId)
        try {
            if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
                socket.emit("errorOccured", "Please enter a valid Room ID");
                return;
            }
            let room = await Room.findById(roomId); // here i have just created an instantiate of that object by finding the id from Room model
            if (room.isJoin) {
                let player = {
                    nickname,
                    socketID: socket.id,
                    playerType: 'O'
                }
                socket.join(roomId);
                room.players.push(player); //we actually pushed it into the array of players
                room.isJoin = false;
                room = await room.save(); //it got saved in mongo db
                console.log(`room status${room.isJoin}`)


                console.log(`room status${room.isJoin}`)
                io.to(roomId).emit("joinRoomSuccess", room);
                console.log(room.players[0]);
                io.to(roomId).emit("updatePlayer", room.players);
                io.to(roomId).emit("updateRoom", room);
            }
            else {
                socket.emit("errorOccured", "The Game is going on , so cannot join");
            }
        }
        catch (e) {
            console.log(e);
        }
    });
    socket.on("tapGrid", async ({ index, roomId }) => {
        try {
            let room = await Room.findById(roomId); //if we are in the same where two ithers also joined

            console.log(`check${room}`);
            console.log(`player typer${room.turn.playerType}`);
            let choice = room.turn.playerType;
            console.log('Now it is reading');
            if (room.turnIndex == 0) { //if turn index is 0 means the first user must have clicked at this point of time
                room.turn = room.players[1];

                room.turnIndex = 1;
                console.log('room turn change to 1');
            }
            else {
                room.turn = room.players[0];
                room.turnIndex = 0;
                console.log('room turn change to 0');
                //   console.log('room turn change to 0');
            }
            room = await room.save();
            console.log(`Room Data changes${room}`);
            io.to(roomId).emit("tappedGrid", {
                index,
                choice,
                room,
            })
        }
        catch (e) {
            console.log(e);
        }
    })
    socket.on("winner", async ({ winnerSocketID, roomID }) => {
        try {
            let room = await Room.findById(roomID);
            let player = room.players.find((player) => player.socketID == winnerSocketID) //the find method actually iterates over the list or map and aslo we are memtioning it by putting the conditions
            player.points +=1; //it is decoupling things into more good way
            room.currentRound +=1;
            room =await room.save();
            if(room.maxRounds==room.currentRound){
                io.to(roomID).emit("endGame",player);
            } 
            else{
                io.to(roomID).emit("pointsIncrease",player);
            }
        }
        catch (e) {
            console.log(e);
        }
    })
});
app.get('/server-ip', async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        const serverIp = response.data.ip;
        res.send(`Server IP address: ${serverIp}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve the server IP');
    }
});
mongoose.connect(DB).then(() => {
    console.log("Connection Succesfully");
}).catch((e) => {
    console.log(e);
});

app.use(express.json());
server.listen(port, "0.0.0.0", () => { // to start a server
    console.log(`Server started and running on port ${port}`);
})

// const http = require("http");
// const express = require("express");
// const app = express();
// const server = http.createServer(app);
// const io = require("socket.io")(server);

// io.on("connection", (socket) => {
//   console.log('Connected!');
// });

// const port = process.env.PORT || 3000;
// server.listen(port, () => {
//   console.log(`Server started and running on port ${port}`);
// });
