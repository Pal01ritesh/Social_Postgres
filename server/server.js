import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/postgresql.js';
import {authRouter} from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js';
import postRouter from './routes/post.routes.js';
import userConnectionRouter from './routes/userConnection.routes.js';
import commentRouter from './routes/comment.routes.js';
import followRouter from './routes/follow.routes.js';
import feedRouter from './routes/feed.routes.js';

const app = express();
const port = process.env.PORT || 4000;
connectDB();

//middleware

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
  

//API endpoints

//home testing
app.get('/', (request, response) => {
    response.send("API is working");
})

app.get('/health', (req, res) => res.send('ok'));


//auth
app.use('/api/auth', authRouter);

// user
app.use('/api/user', userRouter);

// post and comments
app.use('/api/posts', postRouter);

// user connections
app.use('/api/connections', userConnectionRouter);

// comments
app.use('/api/comments', commentRouter);

// follow/unfollow
app.use('/api/follow', followRouter);

// content feed
app.use('/api/feed', feedRouter);

app.listen(port, () => console.log(`server is running on port ${port}`))