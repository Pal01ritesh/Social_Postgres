import Post from "../models/post.model.js";
import userProfileModel from "../models/userProfile.model.js";
import Comment from "../models/comment.model.js";
import UserConnectionModel from "../models/userConnection.model.js";

export const getPersonalizedFeed = async (request, response) => {
  try {
    const userId = request.user.id;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get following connections
    const followingConnections = await UserConnectionModel.findByUserId(userId, 'follow');
    const followingIds = followingConnections.map(conn => conn.connected_user_id);
    const allUserIds = [...followingIds, userId];

    // Get posts from following users and self
    const feedPosts = await Post.findAll(limit, offset);
    const posts = feedPosts.posts || feedPosts;
    
    // Filter posts by user IDs 
    const filteredPosts = posts.filter(post => allUserIds.includes(post.user_id));

    // Get usernames for all users in the feed
    const userIds = [...new Set([
      ...filteredPosts.map(post => post.user_id)
    ])];

    const userProfiles = await userProfileModel.findByUserIds(userIds);
    const usernameMap = {};
    userProfiles.forEach(profile => {
      usernameMap[profile.user_id] = profile.username;
    });

    // Add usernames to posts
    const postsWithUsernames = filteredPosts.map(post => {
      const postObj = { ...post };
      postObj.user = {
        id: post.user_id,
        name: post.user_name,
        email: post.user_email,
        username: usernameMap[post.user_id] || 'unknown'
      };
      
      return postObj;
    });

    const totalPosts = await Post.count();
    const totalPages = Math.ceil(totalPosts / limit);

    return response.json({
      success: true,
      posts: postsWithUsernames,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      feedInfo: {
        totalFollowing: followingIds.length,
        feedSource: "personalized",
      },
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserFeed = async (request, response) => {
  try {
    const { userId } = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    const user = await userProfileModel.findByUserId(userId);
    if (!user) {
      return response.json({
        success: false,
        message: "User not found",
      });
    }

    const userPostsResult = await Post.findByUserId(userId, limit, offset);
    const userPosts = userPostsResult.posts || userPostsResult;

    // Get usernames for all users in the feed
    const userIds = [userId];

    const userProfiles = await userProfileModel.findByUserIds(userIds);
    const usernameMap = {};
    userProfiles.forEach(profile => {
      usernameMap[profile.user_id] = profile.username;
    });

    // Add usernames to posts
    const postsWithUsernames = userPosts.map(post => {
      const postObj = { ...post };
      postObj.user = {
        id: post.user_id,
        name: post.user_name,
        email: post.user_email,
        username: usernameMap[post.user_id] || 'unknown'
      };
      
      return postObj;
    });

    const totalPosts = await Post.count();
    const totalPages = Math.ceil(totalPosts / limit);

    return response.json({
      success: true,
      posts: postsWithUsernames,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      userInfo: {
        userId: userId,
        totalPosts: totalPosts,
      },
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const refreshFeed = async (request, response) => {
  try {
    const userId = request.user.id;
    
    // Get following connections
    const followingConnections = await UserConnectionModel.findByUserId(userId, 'follow');
    const followingIds = followingConnections.map(conn => conn.connected_user_id);
    const allUserIds = [...followingIds, userId];

    // Get recent posts (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // For now, we'll get all posts and filter by date
    // This should be optimized in the model with a date filter
    const recentPostsResult = await Post.findAll(20, 0);
    const recentPosts = recentPostsResult.posts || recentPostsResult;
    
    // Filter by user IDs and date
    const filteredPosts = recentPosts.filter(post => 
      allUserIds.includes(post.user_id) && 
      new Date(post.created_at) >= yesterday
    );

    // Get usernames for all users in the feed
    const userIds = [...new Set([
      ...filteredPosts.map(post => post.user_id)
    ])];

    const userProfiles = await userProfileModel.findByUserIds(userIds);
    const usernameMap = {};
    userProfiles.forEach(profile => {
      usernameMap[profile.user_id] = profile.username;
    });

    // Add usernames to posts
    const postsWithUsernames = filteredPosts.map(post => {
      const postObj = { ...post };
      postObj.user = {
        id: post.user_id,
        name: post.user_name,
        email: post.user_email,
        username: usernameMap[post.user_id] || 'unknown'
      };
      
      return postObj;
    });

    return response.json({
      success: true,
      message: "Feed refreshed successfully",
      recentPosts: postsWithUsernames,
      refreshTime: new Date(),
      newPostsCount: postsWithUsernames.length,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
}; 