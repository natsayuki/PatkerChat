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

function checkName(name){
  if(name.length > 12){
    return 'name must be a max of 12 characters'
  }
  else if(name.length == 0){
    return 'name must be at least 1 character'
  }
  else{
    return 'good';
  }
}

io.on('connection', (socket) => {
  beamit(socket, 'userCount', io.sockets.clients().length);
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
    let sql = 'SELECT * FROM users WHERE username = ?';
    let message = '';
    con.query(sql, [json['username']], function(err, result){
      if(err) throw err;
      result = (JSON.parse(JSON.stringify(result)))[0];
      console.log(result);
      if(result){
        let clientHash = hash.generate(json['password']);
        console.log(clientHash);
        if(hash.verify(json['password'], result['password'])) message = 'logged in as ' + json['username'];
        else message = 'username or password was incorrect';
      }
      else message = 'username or password was incorrect';
      console.log('message: ' + message);
      beamit(socket, 'returnLogin', message)
    });
  });
  socket.on('signup', (json) => {
    let sql = 'SELECT * FROM users WHERE username = ?';
    let check = checkName(json['username']);
    if(check != 'good'){
      console.log('message; ' + check);
      beamit(socket, 'returnSignup', check);
    }
    else{
      let message = '';
      con.query(sql, [json['username']], function(err, result){
        if(err) throw err;
        result = (JSON.parse(JSON.stringify(result)))[0];
        console.log(result);
        if(result){
          message = "username already taken";
          console.log('message: ' + message);
          beamit(socket, 'returnSignup', message);
        }
        else{
          username = json['username'];
          console.log(username)
          password = hash.generate(json['password']);
          sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
          con.query(sql, [username, password], function(err, result){
            if(err) throw err;
            result = (JSON.parse(JSON.stringify(result)))[0];
            console.log(result);
            message = "signup succesful";
            console.log('message: ' + message);
            beamit(socket, 'returnSignup', message);
          });
        }
        console.log('message: ' + message);
        beamit(socket, 'returnSignup', message);
      });

    }

  });
});
io.on('disconnect', (socket) => {
  connections--;
  beamit(socket, 'userCount', connections);
});

server.listen(port, () => {
  console.log("server up on port " + port);
});
