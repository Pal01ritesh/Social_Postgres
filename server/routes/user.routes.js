import express from 'express' 
import userAuth from '../middleware/userAuth.middleware.js';
import { getUserData, getUserProfile, updateUserProfile, updateUsername, searchUsers } from '../controllers/user.controller.js';


const userRouter = express.Router();


userRouter.get('/data', userAuth, getUserData)
userRouter.get('/profile', userAuth, getUserProfile)
userRouter.get('/search', userAuth, searchUsers)
userRouter.put('/profile', userAuth, updateUserProfile)
userRouter.put('/profile/username', userAuth, updateUsername)


export default userRouter;