import express from "express";
import {
  getPersonalizedFeed,
  getUserFeed,
  refreshFeed,
} from "../controllers/feed.controller.js";
import userAuth from "../middleware/userAuth.middleware.js";

const router = express.Router();


router.use(userAuth);

router.get("/personalized", getPersonalizedFeed);
router.get("/user/:userId", getUserFeed);
router.post("/refresh", refreshFeed);

export default router; 