import express from "express";
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  checkFollowStatus,
} from "../controllers/follow.controller.js";
import userAuth from "../middleware/userAuth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Follow management
router.post("/:userId", followUser);
router.delete("/:userId", unfollowUser);

// Get follow information
router.get("/following", getFollowing);
router.get("/followers", getFollowers);
router.get("/status/:userId", checkFollowStatus);

export default router; 