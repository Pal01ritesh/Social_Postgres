import { pool } from '../config/postgresql.js';

class UserProfileModel {
  // Create a new user profile
  static async create(profileData) {
    const { user_id, username, bio, profile_picture, cover_picture, location } = profileData;
    const query = `
      INSERT INTO user_profiles (user_id, username, bio, profile_picture, cover_picture, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [user_id, username, bio || 'Hey there!', profile_picture || 'I am using PingUp.', cover_picture || '', location || ''];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find profile by username
  static async findByUsername(username) {
    const query = `
      SELECT up.*, u.name as user_name, u.email as user_email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.username = $1
    `;
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find profile by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT up.*, u.name as user_name, u.email as user_email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = $1
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find profile by ID
  static async findById(id) {
    const query = `
      SELECT up.*, u.name as user_name, u.email as user_email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Update profile
  static async update(userId, updateData) {
    const { bio, profile_picture, cover_picture, location } = updateData;
    const query = `
      UPDATE user_profiles 
      SET bio = COALESCE($2, bio),
          profile_picture = COALESCE($3, profile_picture),
          cover_picture = COALESCE($4, cover_picture),
          location = COALESCE($5, location),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const values = [userId, bio, profile_picture, cover_picture, location];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete profile
  static async delete(userId) {
    const query = 'DELETE FROM user_profiles WHERE user_id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get profile with follower/following counts
  static async findByIdWithCounts(userId) {
    const query = `
      SELECT up.*, u.name as user_name, u.email as user_email,
             (SELECT COUNT(*) FROM user_connections WHERE connected_user_id = $1 AND connection_type = 'follow') as followers_count,
             (SELECT COUNT(*) FROM user_connections WHERE user_id = $1 AND connection_type = 'follow') as following_count
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = $1
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all profiles with pagination
  static async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT up.*, u.name as user_name, u.email as user_email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      ORDER BY up.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Find profiles by user IDs
  static async findByUserIds(userIds) {
    if (!userIds || userIds.length === 0) return [];
    
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT up.*, u.name as user_name, u.email as user_email
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id IN (${placeholders})
    `;
    
    try {
      const result = await pool.query(query, userIds);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

export default UserProfileModel;
