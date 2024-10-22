import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

const client = createClient();
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const JWT_SECRET = 'ankit';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader ;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// 1. Sign Up
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
 
    const user = await prisma.user.create({
      data: {
        username,
        password
      },
    });

    const sessionToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.json({ sessionToken, userId: user.id });
  
});

// 2. Create Room
app.post('/rooms', authenticateToken, async (req, res) => {
  const { dimensions } = req.body;
  const { userId } = req.user;

  const room = await prisma.room.create({
    data: {
      dimensions,
      userId,
    },
  });
  const roomId = room.id
  const a ={
    roomId,
    userId,
    dimensions
  }

  client.publish('roomCreated', JSON.stringify(a));

  res.json({ roomId: room.id });
});

// 3. Get User Info
app.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      username: true,
      avatarUrl: true,
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

// 4. Update Avatar
app.put('/users/:userId/avatar', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const {avatarUrls} = req.body;
  const { user } = req;

  if (user.userId !== parseInt(userId)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const avatarUrl =avatarUrls
//    "https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg"; // Simple file path as example

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { avatarUrl },
  });

  res.json({ avatarUrl: updatedUser.avatarUrl });
});

// Start server
const PORT =  5001;
app.listen(PORT, async() => {
    await client.connect();
  console.log(`Server is running on port ${PORT}`);
});
