const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketio(server);

function beamit(socket, back, message){
  socket.emit(back, message);
  socket.broadcast.emit(back, message);
}

app.get('/', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

app.use(express.static("static"));

const port = process.env.PORT || 3000;
var mysql = require('mysql');
con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '42turtle'
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
io.on('connection', (socket) => {
  socket.on("message", (message)=>{
    console.log(message);
    string = message["id"] + ": " + message['message']
    beamit(socket, "return", message);
  });
  socket.on("id", (id)=>{
    console.log(id + " has joined");
  });
  socket.on('whisper', (json)=>{
    console.log(json);
    beamit(socket, 'returnWhisper', json);
  });
  // socket.on('login', (json)=>{
  //   console.log(`username: ${json['username']}, password: ${json['password']}`);
  //   let sql = `SELECT * FROM users WHERE username = ${json['username']}`;
  //   con.query(sql, function(err, result){
  //     if(err) throw err;
  //     console.log(result);
  // });
});

console.log('after connect');
server.listen(port, () => {
  console.log("server up on port " + port);
});

});
