const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketio(server);

const hash = require('password-hash');

function beamit(socket, back, message){
  socket.emit(back, message);
  socket.broadcast.emit(back, message);
}

app.get('/', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

app.use(express.static("static"));

const port = process.env.PORT || 3000;

const mysql = require('mysql');
let con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '42turtle',
  database: 'patker_chat'
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
  socket.on('login', (json)=>{
    console.log(json);
    let sql = 'SELECT * FROM users WHERE username = "' + json['username'] + '"';
    let message = '';
    con.query(sql, function(err, result){
      if(err) throw err;
      result = (JSON.parse(JSON.stringify(result)))[0];
      console.log(result);
      if(result){
        let clientHash = hash.generate(json['password']);
        console.log(clientHash);
        if(hash.verify(json['password'], result['password'])) message = 'logged in as ' + json['username'];
        message = 'username or password was incorrect';
      }
      message = 'username or password was incorrect';
    });
    beamit(socket, 'returnLogin', message)
  });
  socket.on('signup', (json) => {
    console.log(json);
    let sql = 'SELECT * FROM users WHERE username = "' + json['username'] + '"';
    let message = '';
    result = null;
    con.query(sql, function(err, result){
      if(err) throw err;
      result = (JSON.parse(JSON.stringify(result)))[0];
      console.log(result);
    });
    if(result){
      message = "username already taken";
    }
    else{
      username = json['username'];
      password = hash.generate(json['password']);
      sql = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;
      con.query(sql, function(err, result){
        if(err) throw err;
        result = (JSON.parse(JSON.stringify(result)))[0];
        console.log(result);
        if(result){
          message = 'succesfully signed up';
        }
      });
    }
    beamit(socket, 'returnSignup', message);
  });
});

server.listen(port, () => {
  console.log("server up on port " + port);
});
