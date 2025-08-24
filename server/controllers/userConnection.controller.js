import UserConnectionModel from "../models/userConnection.model.js";
import userModel from "../models/user.model.js";

export const sendConnectionRequest = async (request, response) => {
  try {
    const { toUserId } = request.body;
    const fromUserId = request.user.id;

    if (!toUserId) {
      return response.json({
        success: false,
        message: "User ID to connect with is required",
      });
    }

    if (fromUserId === toUserId) {
      return response.json({
        success: false,
        message: "You cannot send connection request to yourself",
      });
    }

    const toUser = await userModel.findById(toUserId);
    if (!toUser) {
      return response.json({
        success: false,
        message: "User not found",
      });
    }

    const existingConnection = await UserConnectionModel.findByUsers(fromUserId, toUserId);

    if (existingConnection) {
      if (existingConnection.connection_type === "friend") {
        return response.json({
          success: false,
          message: "You are already connected with this user",
        });
      } else if (existingConnection.connection_type === "follow") {
        if (existingConnection.user_id === fromUserId) {
          return response.json({
            success: false,
            message: "Connection request already sent",
          });
        } else {
          return response.json({
            success: false,
            message: "This user has already sent you a connection request",
          });
        }
      }
    }

    const connection = await UserConnectionModel.create({
      user_id: fromUserId,
      connected_user_id: toUserId,
      connection_type: "follow",
    });

    return response.json({
      success: true,
      message: "Connection request sent successfully",
      connection,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptConnectionRequest = async (request, response) => {
  try {
    const { connectionId } = request.params;
    const userId = request.user.id;

    const connection = await UserConnectionModel.findById(connectionId);
    if (!connection) {
      return response.json({
        success: false,
        message: "Connection request not found",
      });
    }

    if (connection.connected_user_id !== userId) {
      return response.json({
        success: false,
        message: "You can only accept connection requests sent to you",
      });
    }

    if (connection.connection_type === "friend") {
      return response.json({
        success: false,
        message: "Connection request already accepted",
      });
    }

    const updatedConnection = await UserConnectionModel.updateStatus(connectionId, "friend");

    return response.json({
      success: true,
      message: "Connection request accepted successfully",
      connection: updatedConnection,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectConnectionRequest = async (request, response) => {
  try {
    const { connectionId } = request.params;
    const userId = request.user.id;

    const connection = await UserConnectionModel.findById(connectionId);
    if (!connection) {
      return response.json({
        success: false,
        message: "Connection request not found",
      });
    }

    if (
      connection.user_id !== userId &&
      connection.connected_user_id !== userId
    ) {
      return response.json({
        success: false,
        message: "You can only reject your own connection requests",
      });
    }

    await UserConnectionModel.delete(connectionId);

    return response.json({
      success: true,
      message: "Connection request removed successfully",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingConnections = async (request, response) => {
  try {
    const userId = request.user.id;

    const pendingConnections = await UserConnectionModel.findConnectedUsers(userId, "follow");

    return response.json({
      success: true,
      pendingConnections,
      count: pendingConnections.length,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getAcceptedConnections = async (request, response) => {
  try {
    const userId = request.user.id;

    const acceptedConnections = await UserConnectionModel.findByUserId(userId, "friend");

    const formattedConnections = acceptedConnections.map((connection) => {
      const otherUser =
        connection.user_id === userId
          ? {
              id: connection.connected_user_id,
              name: connection.connected_user_name,
              email: connection.connected_user_email,
            }
          : {
              id: connection.user_id,
              name: connection.user_name,
              email: connection.user_email,
            };
      return {
        id: connection.id,
        user: otherUser,
        status: connection.connection_type,
        created_at: connection.created_at,
      };
    });

    return response.json({
      success: true,
      connections: formattedConnections,
      count: formattedConnections.length,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getSentConnections = async (request, response) => {
  try {
    const userId = request.user.id;

    const sentConnections = await UserConnectionModel.findByUserId(userId, "follow");

    return response.json({
      success: true,
      sentConnections,
      count: sentConnections.length,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getConnectionStatus = async (request, response) => {
  try {
    const { userId } = request.params;
    const currentUserId = request.user.id;

    if (currentUserId === userId) {
      return response.json({
        success: false,
        message: "Cannot check connection status with yourself",
      });
    }

    const connection = await UserConnectionModel.findByUsers(currentUserId, userId);

    if (!connection) {
      return response.json({
        success: true,
        status: "none",
        message: "No connection exists",
      });
    }

    let status = connection.connection_type;
    if (connection.connection_type === "follow") {
      status = connection.user_id === currentUserId ? "sent" : "received";
    }

    return response.json({
      success: true,
      status,
      connection,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
}; 