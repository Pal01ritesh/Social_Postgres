import express from "express";
import {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../controllers/comment.controller.js";
import userAuth from "../middleware/userAuth.middleware.js";

const router = express.Router();


router.use(userAuth);


router.post("/:postId", addComment);
router.get("/:postId", getPostComments);
router.put("/:commentId", updateComment);
router.delete("/:commentId", deleteComment);
router.put("/:commentId/like", toggleCommentLike);

export default router; 