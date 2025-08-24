import { pool } from '../config/postgresql.js';

class CommentModel {
  // Create a new comment
  static async create(commentData) {
    const { user_id, post_id, content, parent_comment_id } = commentData;
    const query = `
      INSERT INTO comments (user_id, post_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [user_id, post_id, content, parent_comment_id || null];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find comment by ID
  static async findById(id) {
    const query = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get comments by post ID
  static async findByPostId(postId, limit = 10, offset = 0) {
    const query = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.parent_comment_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [postId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get replies to a comment
  static async findReplies(commentId, limit = 10, offset = 0) {
    const query = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.parent_comment_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [commentId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get comments by user ID
  static async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update comment
  static async update(id, updateData) {
    const { content } = updateData;
    const query = `
      UPDATE comments 
      SET content = $2, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, content];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete comment
  static async delete(id) {
    const query = 'DELETE FROM comments WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete comments by post ID
  static async deleteByPostId(postId) {
    const query = 'DELETE FROM comments WHERE post_id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [postId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update likes count
  static async updateLikesCount(id, likesCount) {
    const query = `
      UPDATE comments 
      SET likes_count = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, likesCount]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get comment with replies count
  static async findByIdWithRepliesCount(id) {
    const query = `
      SELECT c.*, u.name as user_name, u.email as user_email,
             (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id) as replies_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get total count of comments for a post
  static async countByPostId(postId) {
    const query = 'SELECT COUNT(*) FROM comments WHERE post_id = $1';
    
    try {
      const result = await pool.query(query, [postId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Get comments by post ID with pagination and total count
  static async findByPostIdWithCount(postId, limit = 10, offset = 0) {
    const countQuery = 'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND parent_comment_id IS NULL';
    const commentsQuery = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.parent_comment_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const [countResult, commentsResult] = await Promise.all([
        pool.query(countQuery, [postId]),
        pool.query(commentsQuery, [postId, limit, offset])
      ]);
      
      return {
        comments: commentsResult.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      throw error;
    }
  }
}

export default CommentModel; 