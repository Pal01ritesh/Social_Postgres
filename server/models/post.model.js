import { pool } from '../config/postgresql.js';

class PostModel {
  // Create a new post
  static async create(postData) {
    const { user_id, content, image_urls, post_type } = postData;
    const query = `
      INSERT INTO posts (user_id, content, image_urls, post_type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [user_id, content, image_urls || [], post_type];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find post by ID
  static async findById(id) {
    const query = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get posts by user ID
  static async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all posts with pagination
  static async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update post
  static async update(id, updateData) {
    const { content, image_urls, post_type, comments_enabled } = updateData;
    const query = `
      UPDATE posts 
      SET content = COALESCE($2, content),
          image_urls = COALESCE($3, image_urls),
          post_type = COALESCE($4, post_type),
          comments_enabled = COALESCE($5, comments_enabled),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, content, image_urls, post_type, comments_enabled];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete post
  static async delete(id) {
    const query = 'DELETE FROM posts WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update likes count
  static async updateLikesCount(id, likesCount) {
    const query = `
      UPDATE posts 
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

  // Update comments count
  static async updateCommentsCount(id, commentsCount) {
    const query = `
      UPDATE posts 
      SET comments_count = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, commentsCount]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get total count of posts
  static async count() {
    const query = 'SELECT COUNT(*) FROM posts';
    
    try {
      const result = await pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Get posts by user ID with total count
  static async findByUserIdWithCount(userId, limit = 10, offset = 0) {
    const countQuery = 'SELECT COUNT(*) FROM posts WHERE user_id = $1';
    const postsQuery = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const [countResult, postsResult] = await Promise.all([
        pool.query(countQuery, [userId]),
        pool.query(postsQuery, [userId, limit, offset])
      ]);
      
      return {
        posts: postsResult.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      throw error;
    }
  }
}

export default PostModel;
