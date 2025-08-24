import userProfileModel from "../models/userProfile.model.js";
import userModel from "../models/user.model.js";
import UserConnectionModel from "../models/userConnection.model.js";

export const followUser = async (request, response) => {
  try {
    const { userId } = request.params;
    const currentUserId = request.user.id;

    if (currentUserId === userId) {
      return response.json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const targetUser = await userModel.findById(userId);
    if (!targetUser) {
      return response.json({
        success: false,
        message: "User not found",
      });
    }

    let currentUserProfile = await userProfileModel.findByUserId(currentUserId);
    if (!currentUserProfile) {
      // Generate a unique username if profile doesn't exist
      const baseUsername = `user_${currentUserId}`;
      let username = baseUsername;
      let counter = 1;
      
      while (await userProfileModel.findByUsername(username)) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }
      
      currentUserProfile = await userProfileModel.create({
        user_id: currentUserId,
        username: username,
      });
    }

    let targetUserProfile = await userProfileModel.findByUserId(userId);
    if (!targetUserProfile) {
      // Generate a unique username if profile doesn't exist
      const baseUsername = `user_${userId}`;
      let username = baseUsername;
      let counter = 1;
      
      while (await userProfileModel.findByUsername(username)) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }
      
      targetUserProfile = await userProfileModel.create({
        user_id: userId,
        username: username,
      });
    }

    // Check if already following
    const existingConnection = await UserConnectionModel.areConnected(currentUserId, userId, 'follow');
    if (existingConnection) {
      return response.json({
        success: false,
        message: "You are already following this user",
      });
    }

    // Create follow connection
    await UserConnectionModel.create({
      user_id: currentUserId,
      connected_user_id: userId,
      connection_type: 'follow'
    });

    return response.json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const unfollowUser = async (request, response) => {
  try {
    const { userId } = request.params;
    const currentUserId = request.user.id;

    if (currentUserId === userId) {
      return response.json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    const currentUserProfile = await userProfileModel.findByUserId(currentUserId);
    if (!currentUserProfile) {
      return response.json({
        success: false,
        message: "User profile not found",
      });
    }

    // Check if following
    const existingConnection = await UserConnectionModel.areConnected(currentUserId, userId, 'follow');
    if (!existingConnection) {
      return response.json({
        success: false,
        message: "You are not following this user",
      });
    }

    // Remove follow connection
    await UserConnectionModel.deleteByUsers(currentUserId, userId);

    return response.json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowing = async (request, response) => {
  try {
    const currentUserId = request.user.id;

    const userProfile = await userProfileModel.findByUserId(currentUserId);
    if (!userProfile) {
      return response.json({
        success: true,
        following: [],
        count: 0,
      });
    }

    // Get following connections
    const followingConnections = await UserConnectionModel.findByUserId(currentUserId, 'follow');
    const followingUserIds = followingConnections.map(conn => conn.connected_user_id);

    if (followingUserIds.length === 0) {
      return response.json({
        success: true,
        following: [],
        count: 0,
      });
    }

    const followingUsers = await userModel.findByIds(followingUserIds);

    return response.json({
      success: true,
      following: followingUsers,
      count: followingUsers.length,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowers = async (request, response) => {
  try {
    const currentUserId = request.user.id;

    const userProfile = await userProfileModel.findByUserId(currentUserId);
    if (!userProfile) {
      return response.json({
        success: true,
        followers: [],
        count: 0,
      });
    }

    // Get followers connections
    const followerConnections = await UserConnectionModel.findConnectedUsers(currentUserId, 'follow');
    const followerUserIds = followerConnections.map(conn => conn.user_id);

    if (followerUserIds.length === 0) {
      return response.json({
        success: true,
        followers: [],
        count: 0,
      });
    }

    const followers = await userModel.findByIds(followerUserIds);

    return response.json({
      success: true,
      followers: followers,
      count: followers.length,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const checkFollowStatus = async (request, response) => {
  try {
    const { userId } = request.params;
    const currentUserId = request.user.id;

    if (currentUserId === userId) {
      return response.json({
        success: true,
        isFollowing: false,
        isFollowedBy: false,
        message: "Cannot check follow status with yourself",
      });
    }

    const currentUserProfile = await userProfileModel.findByUserId(currentUserId);
    const targetUserProfile = await userProfileModel.findByUserId(userId);

    if (!currentUserProfile || !targetUserProfile) {
      return response.json({
        success: true,
        isFollowing: false,
        isFollowedBy: false,
      });
    }

    const isFollowing = await UserConnectionModel.areConnected(currentUserId, userId, 'follow');
    const isFollowedBy = await UserConnectionModel.areConnected(userId, currentUserId, 'follow');

    return response.json({
      success: true,
      isFollowing,
      isFollowedBy,
      isMutual: isFollowing && isFollowedBy,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
}; 