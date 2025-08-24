import express from "express";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingConnections,
  getAcceptedConnections,
  getSentConnections,
  getConnectionStatus,
} from "../controllers/userConnection.controller.js";
import userAuth from "../middleware/userAuth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Connection management
router.post("/send-request", sendConnectionRequest);
router.put("/accept/:connectionId", acceptConnectionRequest);
router.delete("/reject/:connectionId", rejectConnectionRequest);

// Get connection information
router.get("/pending", getPendingConnections);
router.get("/accepted", getAcceptedConnections);
router.get("/sent", getSentConnections);
router.get("/status/:userId", getConnectionStatus);

export default router; 