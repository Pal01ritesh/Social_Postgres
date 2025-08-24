import { pool } from '../config/postgresql.js';

class UserModel {
  // Create a new user
  static async create(userData) {
    const { name, email, password } = userData;
    const query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, email, password];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Update user verification status
  static async updateVerificationStatus(id, isVerified) {
    const query = `
      UPDATE users 
      SET is_account_verified = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, isVerified]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update OTP fields
  static async updateOtp(id, otpType, otp, expireAt) {
    let query;
    let values;
    
    if (otpType === 'verify') {
      query = `
        UPDATE users 
        SET verify_otp = $2, verify_otp_expire_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      values = [id, otp, expireAt];
    } else if (otpType === 'reset') {
      query = `
        UPDATE users 
        SET reset_otp = $2, reset_otp_expire_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      values = [id, otp, expireAt];
    }
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const query = `
      UPDATE users 
      SET password = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, newPassword]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all users (for admin purposes)
  static async findAll() {
    const query = 'SELECT id, name, email, is_account_verified, created_at FROM users ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Search users by name or username
  static async searchUsers(searchQuery, currentUserId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        u.id, u.name, u.email, u.is_account_verified, u.created_at,
        up.username, up.bio, up.profile_picture, up.cover_picture, up.location,
        (SELECT COUNT(*) FROM user_connections WHERE connected_user_id = u.id AND connection_type = 'follow') as followers_count,
        (SELECT COUNT(*) FROM user_connections WHERE user_id = u.id AND connection_type = 'follow') as following_count
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE (u.name ILIKE $1 OR up.username ILIKE $1) AND u.id != $2
      ORDER BY 
        CASE 
          WHEN u.name ILIKE $1 THEN 1
          WHEN up.username ILIKE $1 THEN 2
          ELSE 3
        END,
        u.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE (u.name ILIKE $1 OR up.username ILIKE $1) AND u.id != $2
    `;
    
    try {
      const searchPattern = `%${searchQuery}%`;
      const [results, countResult] = await Promise.all([
        pool.query(query, [searchPattern, currentUserId, limit, offset]),
        pool.query(countQuery, [searchPattern, currentUserId])
      ]);
      
      return {
        users: results.rows,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // Find users by IDs
  static async findByIds(userIds) {
    if (!userIds || userIds.length === 0) return [];
    
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT id, name, email, is_account_verified, created_at
      FROM users 
      WHERE id IN (${placeholders})
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await pool.query(query, userIds);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

export default UserModel;