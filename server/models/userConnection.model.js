import { pool } from '../config/postgresql.js';

class UserConnectionModel {
  // Create a new connection
  static async create(connectionData) {
    const { user_id, connected_user_id, connection_type } = connectionData;
    const query = `
      INSERT INTO user_connections (user_id, connected_user_id, connection_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [user_id, connected_user_id, connection_type];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find connection by ID
  static async findById(id) {
    const query = `
      SELECT uc.*, 
             u1.name as user_name, u1.email as user_email,
             u2.name as connected_user_name, u2.email as connected_user_email
      FROM user_connections uc
      JOIN users u1 ON uc.user_id = u1.id
      JOIN users u2 ON uc.connected_user_id = u2.id
      WHERE uc.id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find connection between two users
  static async findByUsers(userId, connectedUserId) {
    const query = `
      SELECT uc.*, 
             u1.name as user_name, u1.email as user_email,
             u2.name as connected_user_name, u2.email as connected_user_email
      FROM user_connections uc
      JOIN users u1 ON uc.user_id = u1.id
      JOIN users u2 ON uc.connected_user_id = u2.id
      WHERE (uc.user_id = $1 AND uc.connected_user_id = $2) 
         OR (uc.user_id = $2 AND uc.connected_user_id = $1)
    `;
    
    try {
      const result = await pool.query(query, [userId, connectedUserId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get all connections for a user
  static async findByUserId(userId, connectionType = null) {
    let query = `
      SELECT uc.*, 
             u1.name as user_name, u1.email as user_email,
             u2.name as connected_user_name, u2.email as connected_user_email
      FROM user_connections uc
      JOIN users u1 ON uc.user_id = u1.id
      JOIN users u2 ON uc.connected_user_id = u2.id
      WHERE uc.user_id = $1
    `;
    
    let values = [userId];
    
    if (connectionType) {
      query += ' AND uc.connection_type = $2';
      values.push(connectionType);
    }
    
    query += ' ORDER BY uc.created_at DESC';
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all users connected to a specific user
  static async findConnectedUsers(userId, connectionType = null) {
    let query = `
      SELECT uc.*, 
             u1.name as user_name, u1.email as user_email,
             u2.name as connected_user_name, u2.email as connected_user_email
      FROM user_connections uc
      JOIN users u1 ON uc.user_id = u1.id
      JOIN users u2 ON uc.connected_user_id = u2.id
      WHERE uc.connected_user_id = $1
    `;
    
    let values = [userId];
    
    if (connectionType) {
      query += ' AND uc.connection_type = $2';
      values.push(connectionType);
    }
    
    query += ' ORDER BY uc.created_at DESC';
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update connection status
  static async updateStatus(id, status) {
    const query = `
      UPDATE user_connections 
      SET connection_type = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [id, status]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete connection
  static async delete(id) {
    const query = 'DELETE FROM user_connections WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete connection between two users
  static async deleteByUsers(userId, connectedUserId) {
    const query = `
      DELETE FROM user_connections 
      WHERE (user_id = $1 AND connected_user_id = $2) 
         OR (user_id = $2 AND connected_user_id = $1)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [userId, connectedUserId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Check if two users are connected
  static async areConnected(userId, connectedUserId, connectionType = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM user_connections 
      WHERE (user_id = $1 AND connected_user_id = $2) 
         OR (user_id = $2 AND connected_user_id = $1)
    `;
    
    let values = [userId, connectedUserId];
    
    if (connectionType) {
      query += ' AND connection_type = $3';
      values.push(connectionType);
    }
    
    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get connection count for a user
  static async getConnectionCount(userId, connectionType = null) {
    let query = 'SELECT COUNT(*) as count FROM user_connections WHERE user_id = $1';
    let values = [userId];
    
    if (connectionType) {
      query += ' AND connection_type = $2';
      values.push(connectionType);
    }
    
    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Get followers count for a user
  static async getFollowersCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM user_connections WHERE connected_user_id = $1 AND connection_type = $2';
    
    try {
      const result = await pool.query(query, [userId, 'follow']);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // Get following count for a user
  static async getFollowingCount(userId) {
    const query = 'SELECT COUNT(*) as count FROM user_connections WHERE user_id = $1 AND connection_type = $2';
    
    try {
      const result = await pool.query(query, [userId, 'follow']);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

export default UserConnectionModel;
