require('dotenv').config();

const express = require('express');
const app = express();

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  tls: true
});

const db = client.db("chat");
const users = db.collection("users");
const messages_data = db.collection("messages_data");
async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error)
  }
}
run().catch(console.dir);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:3000", 
    origin: ["http://localhost:3000", "https://chatting-3tub.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"]
});

app.use(cors({
  origin: ["http://localhost:3000", "https://chatting-3tub.onrender.com"],
  methods: ["GET","POST"],
  credentials: true
}));

app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/api/getConvos', async(req, res) => {
  
  const username = req.query.username;
  console.log("Username here:", username); //
  if (!username){
    return res.status(400).json({error: "Username is required" });
  }
  console.log("user is:", username);
  try{
    const sent = await messages_data.distinct("receivedby",{sentby: username});
  const received = await messages_data.distinct("sentby",{receivedby: username});

  const convos = Array.from(new Set([...sent, ...received]));
  res.json({convos});
  } catch (error){
    console.error("Error fetching conversations:", error);
    return res.status(500).json({error: "Internal server error"});
  }
  
});


app.post('/api/findperson', async(req, res) => {
  console.log("finding person endpoint hit:", req.body);
  const {username} = req.body;

  const userExists = await users.findOne({username});
  if (userExists) {
    console.log("User exists", {username});
    return res.json({username});
  }
  else{
    res.status(400).json('User does not exist');
  }
});

app.post('/api/login', async(req, res) => {
  console.log("Login endpoint hit:", req.body);
  const { username , password } = req.body;

  const userExists = await users.findOne({username,password});
  if (userExists) {
    return res.json({username});
  } else {
    res.status(400).json('invalid Username or Password');
  }
});

app.post('/api/signup', async(req, res) => {
  console.log("signup endpoint hit:", req.body);
  const { username , password } = req.body;

  const userExists = await users.findOne({username});
  if (userExists) {
    res.status(400).json('Username already exists pick another user/password');
  }else {
    if (username === "" || password === "") {
      res.status(400).json('Username or Password cannot be empty');
    } else {
      const newUser = await users.insertOne({username,password});
      return res.json({username,password});
    }
    
  }
});

app.post('/api/getMessages', async(req, res) => {
  console.log("get messages endpoint hit:", req.body);
  const { username, chattingUser } = req.body;

  const myMessages = await messages_data
  .find({sentby: username, receivedby: chattingUser}, 
  ).sort({timestamp: 1}).toArray();

  const theirMessages = await messages_data
  .find({sentby: chattingUser, receivedby: username})
  .sort({timestamp: 1}).toArray();

  console.log("Messages found:", { myMessages, theirMessages });

  return res.json({myMessages,theirMessages});
});


io.on('connection', (socket) => {
    console.log('a user connected hereee') 
    socket.on('message', ({message, username, chattingUser, timestamp}) => {
        io.emit('getMessage', {message, username, chattingUser, timestamp});
        const messageData = 
            {sentby: username, receivedby: chattingUser,timestamp: timestamp, message: message}
        messages_data.insertOne(messageData);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected')
    });

  });


const PORT = process.env.PORT || 50508;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});