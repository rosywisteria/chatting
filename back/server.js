const express = require('express');
const app = express();

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://bridge:fjPLHycyl9xPnlST@cluster0.j0ucs.mongodb.net/?retryWrites=true&writeConcern=majority";
const client = new MongoClient(uri);

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
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!')
});
// app.get("/users", async (req, res) => {
//   const users = await users.find();
//   res.json(users);
//   console.log("Users found:", users);
// });

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