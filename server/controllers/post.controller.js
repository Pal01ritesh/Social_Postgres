import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import userProfileModel from "../models/userProfile.model.js";

export const createPost = async (request, response) => {
  try {
    const { content, image_urls, post_type, comments_enabled } = request.body;
    const userId = request.user.id;

    if (!content && (!image_urls || image_urls.length === 0)) {
      return response.json({
        success: false,
        message: "Post content or image is required",
      });
    }

    if (!post_type || !["text", "image", "text_with_image"].includes(post_type)) {
      return response.json({
        success: false,
        message: "Invalid post type",
      });
    }

    const post = await Post.create({
      user_id: userId,
      content: content || "",
      image_urls: image_urls || [],
      post_type,
      comments_enabled: comments_enabled !== undefined ? comments_enabled : true,
    });

    // Get username for the post creator
    const userProfile = await userProfileModel.findByUserId(userId);
    const postWithUsername = {
      ...post,
      user: {
        id: post.user_id,
        name: request.user.name,
        email: request.user.email,
        username: userProfile?.username || 'unknown'
      }
    };

    return response.json({
      success: true,
      message: "Post created successfully",
      post: postWithUsername,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getPosts = async (request, response) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    const postsResult = await Post.findAll(limit, offset);
    const posts = postsResult.posts || postsResult;

    // Get usernames for all users in the posts
    const userIds = [...new Set([
      ...posts.map(post => post.user_id),
      ...posts.flatMap(post => post.comments ? post.comments.map(comment => comment.user_id) : [])
    ])];

    const userProfiles = await userProfileModel.findByUserIds(userIds);
    const usernameMap = {};
    userProfiles.forEach(profile => {
      usernameMap[profile.user_id] = profile.username;
    });

    // Add usernames to posts
    const postsWithUsernames = posts.map(post => {
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
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getPost = async (request, response) => {
  try {
    const { postId } = request.params;

    const post = await Post.findById(postId);
    if (!post) {
      return response.json({
        success: false,
        message: "Post not found",
      });
    }

    // Get comments for this post
    const commentsResult = await Comment.findByPostId(postId, 20, 0);
    const comments = commentsResult.comments || commentsResult;

    // Get usernames for all users in the post
    const userIds = [
      post.user_id,
      ...comments.map(comment => comment.user_id)
    ];

    const userProfiles = await userProfileModel.findByUserIds(userIds);
    const usernameMap = {};
    userProfiles.forEach(profile => {
      usernameMap[profile.user_id] = profile.username;
    });

    // Add usernames to post and comments
    const postWithUsername = {
      ...post,
      user: {
        id: post.user_id,
        name: post.user_name,
        email: post.user_email,
        username: usernameMap[post.user_id] || 'unknown'
      },
      comments: comments.map(comment => ({
        ...comment,
        user: {
          id: comment.user_id,
          name: comment.user_name,
          email: comment.user_email,
          username: usernameMap[comment.user_id] || 'unknown'
        }
      }))
    };

    return response.json({
      success: true,
      post: postWithUsername,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const togglePostLike = async (request, response) => {
  try {
    const { postId } = request.params;
    const userId = request.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return response.json({
        success: false,
        message: "Post not found",
      });
    }

    // This would need a separate likes table implementation
    // For now, we'll just toggle the likes count
    const newLikesCount = post.likes_count === 0 ? 1 : 0;
    const updatedPost = await Post.updateLikesCount(postId, newLikesCount);

    return response.json({
      success: true,
      message: newLikesCount > 0 ? "Post liked" : "Post unliked",
      likes_count: updatedPost.likes_count,
      isLiked: newLikesCount > 0,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleComments = async (request, response) => {
  try {
    const { postId } = request.params;
    const userId = request.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return response.json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.user_id !== userId) {
      return response.json({
        success: false,
        message: "You can only modify comments on your own posts",
      });
    }

    const newCommentsEnabled = !post.comments_enabled;
    const updatedPost = await Post.update(postId, { comments_enabled: newCommentsEnabled });

    return response.json({
      success: true,
      message: `Comments ${updatedPost.comments_enabled ? 'enabled' : 'disabled'} successfully`,
      comments_enabled: updatedPost.comments_enabled,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePost = async (request, response) => {
  try {
    const { postId } = request.params;
    const userId = request.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return response.json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.user_id !== userId) {
      return response.json({
        success: false,
        message: "You can only delete your own posts",
      });
    }

    // Delete all comments for this post
    await Comment.deleteByPostId(postId);

    // Delete the post
    await Post.delete(postId);

    return response.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
}; 