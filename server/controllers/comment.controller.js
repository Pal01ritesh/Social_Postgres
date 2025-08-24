import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import userProfileModel from "../models/userProfile.model.js";

export const addComment = async (request, response) => {
  try {
    const { postId } = request.params;
    const { content, parentCommentId } = request.body;
    const userId = request.user.id;

    if (!content || content.trim().length === 0) {
      return response.json({
        success: false,
        message: "Comment content is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return response.json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.comments_enabled) {
      return response.json({
        success: false,
        message: "Comments are disabled on this post",
      });
    }

    const commentData = {
      user_id: userId,
      post_id: postId,
      content: content.trim(),
    };

    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return response.json({
          success: false,
          message: "Parent comment not found",
        });
      }
      commentData.parent_comment_id = parentCommentId;
    }

    const comment = await Comment.create(commentData);

    // Get username for the comment creator
    const userProfile = await userProfileModel.findByUserId(userId);
    const commentWithUsername = {
      ...comment,
      user: {
        id: comment.user_id,
        name: request.user.name,
        email: request.user.email,
        username: userProfile?.username || 'unknown'
      }
    };

    // Update post comments count
    await Post.updateCommentsCount(postId, post.comments_count + 1);

    return response.json({
      success: true,
      message: "Comment added successfully",
      comment: commentWithUsername,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostComments = async (request, response) => {
  try {
    const { postId } = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;
    const offset = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return response.json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.comments_enabled) {
      return response.json({
        success: false,
        message: "Comments are disabled on this post",
        comments: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalComments: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    const commentsResult = await Comment.findByPostIdWithCount(postId, limit, offset);
    const comments = commentsResult.comments || commentsResult;

    // Get usernames for all users in the comments
    const userIds = [...new Set([
      ...comments.map(comment => comment.user_id)
    ])];

    const userProfiles = await userProfileModel.findByUserIds(userIds);
    const usernameMap = {};
    userProfiles.forEach(profile => {
      usernameMap[profile.user_id] = profile.username;
    });

    // Add usernames to comments
    const commentsWithUsernames = comments.map(comment => {
      const commentObj = { ...comment };
      commentObj.user = {
        id: comment.user_id,
        name: comment.user_name,
        email: comment.user_email,
        username: usernameMap[comment.user_id] || 'unknown'
      };
      
      return commentObj;
    });

    const totalComments = commentsResult.total || comments.length;
    const totalPages = Math.ceil(totalComments / limit);

    return response.json({
      success: true,
      comments: commentsWithUsernames,
      pagination: {
        currentPage: page,
        totalPages,
        totalComments,
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

export const updateComment = async (request, response) => {
  try {
    const { commentId } = request.params;
    const { content } = request.body;
    const userId = request.user.id;

    if (!content || content.trim().length === 0) {
      return response.json({
        success: false,
        message: "Comment content is required",
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return response.json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user_id !== userId) {
      return response.json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    const updatedComment = await Comment.update(commentId, { content: content.trim() });

    return response.json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteComment = async (request, response) => {
  try {
    const { commentId } = request.params;
    const userId = request.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return response.json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user_id !== userId) {
      return response.json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    // Update post comments count
    const post = await Post.findById(comment.post_id);
    if (post) {
      await Post.updateCommentsCount(comment.post_id, Math.max(0, post.comments_count - 1));
    }

    // Delete the comment
    await Comment.delete(commentId);

    return response.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleCommentLike = async (request, response) => {
  try {
    const { commentId } = request.params;
    const userId = request.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return response.json({
        success: false,
        message: "Comment not found",
      });
    }

    // This would need a separate likes table implementation
    // For now, we'll just toggle the likes count
    const newLikesCount = comment.likes_count === 0 ? 1 : 0;
    const updatedComment = await Comment.updateLikesCount(commentId, newLikesCount);

    return response.json({
      success: true,
      message: newLikesCount > 0 ? "Comment liked" : "Comment unliked",
      likes_count: updatedComment.likes_count,
      isLiked: newLikesCount > 0,
    });
  } catch (error) {
    return response.json({
      success: false,
      message: error.message,
    });
  }
}; 