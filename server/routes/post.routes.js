import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  togglePostLike,
  deletePost,
  toggleComments,
} from "../controllers/post.controller.js";
import userAuth from "../middleware/userAuth.middleware.js";

const router = express.Router();

// Post routes
router.post("/create", userAuth, createPost);
router.get("/", getPosts);
router.get("/:postId", getPost);
router.put("/:postId/like", userAuth, togglePostLike);
router.put("/:postId/comments", userAuth, toggleComments);
router.delete("/:postId", userAuth, deletePost);

export default router; 