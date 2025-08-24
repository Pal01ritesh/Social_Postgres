import userModel from "../models/user.model.js";
import userProfileModel from "../models/userProfile.model.js";
import UserConnectionModel from "../models/userConnection.model.js";

export const getUserData = async (request, response) => {
    try {
        const userId = request.user.id;
        const user = await userModel.findById(userId);
        
        if(!user){
            return response.json({
                success : false,
                message : "user not found"
            })
        }

        response.json({
            success : true,
            userData : {
                name : user.name,
                is_account_verified : user.is_account_verified
             }
        })
        
    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

export const getUserProfile = async (request, response) => {
    try {
        const userId = request.user.id;
        const user = await userModel.findById(userId);
        
        if(!user){
            return response.json({
                success : false,
                message : "User not found"
            })
        }

        const userProfile = await userProfileModel.findByUserId(userId);
        
        // Get follower and following counts
        const followersCount = await UserConnectionModel.getFollowersCount(userId);
        const followingCount = await UserConnectionModel.getFollowingCount(userId);
        
        response.json({
            success : true,
            message: "User profile retrieved successfully",
            data: {
                username: userProfile?.username || null,
                bio: userProfile?.bio || null,
                profile_picture: userProfile?.profile_picture || null,
                cover_picture: userProfile?.cover_picture || null,
                location: userProfile?.location || null,
                followers_count: followersCount,
                following_count: followingCount,
            }
        })
        
    } catch (error) {
        return response.json({
            success : false,
            message : error.message
        })
    }
}

export const searchUsers = async (request, response) => {
    try {
        const { query, page = 1, limit = 10 } = request.query;
        const currentUserId = request.user.id;
        
        if (!query || query.trim().length === 0) {
            return response.json({
                success: false,
                message: "Search query is required"
            });
        }

        const searchQuery = query.trim();

        // Search users using PostgreSQL
        const searchResults = await userModel.searchUsers(searchQuery, currentUserId, parseInt(page), parseInt(limit));

        // Add connection status for each user
        const usersWithConnectionStatus = await Promise.all(
            searchResults.users.map(async (user) => {
                // Check if current user is following this user
                const isFollowing = await UserConnectionModel.areConnected(currentUserId, user.id, 'follow');
                
                // Check if there's a connection request
                const connectionExists = await UserConnectionModel.areConnected(currentUserId, user.id);
                
                let connectionStatus = "none";
                if (isFollowing) {
                    connectionStatus = "following";
                } else if (connectionExists) {
                    connectionStatus = "connected";
                }

                return {
                    ...user,
                    connection_status: connectionStatus,
                    is_following: isFollowing
                };
            })
        );

        response.json({
            success: true,
            message: "Search completed successfully",
            data: {
                users: usersWithConnectionStatus,
                search_query: searchQuery,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: searchResults.totalPages,
                    totalUsers: searchResults.total,
                    hasNext: parseInt(page) < searchResults.totalPages,
                    hasPrev: parseInt(page) > 1,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        return response.json({
            success: false,
            message: error.message
        });
    }
};

export const updateUserProfile = async (request, response) => {
    try {
        const userId = request.user.id;
        const { username, bio, location, profile_picture, cover_photo } = request.body;

        // Validate input
        if (!username && !bio && !location && !profile_picture && !cover_photo) {
            return response.json({
                success: false,
                message: "At least one field is required to update"
            });
        }

        // Username validation
        if (username) {
            if (username.length < 3) {
                return response.json({
                    success: false,
                    message: "Username must be at least 3 characters long"
                });
            }
            if (username.length > 30) {
                return response.json({
                    success: false,
                    message: "Username must be less than 30 characters"
                });
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return response.json({
                    success: false,
                    message: "Username can only contain letters, numbers, and underscores"
                });
            }
        }

        // Check if username already exists (if updating username)
        if (username) {
            const existingProfile = await userProfileModel.findByUsername(username);
            if (existingProfile && existingProfile.user_id !== userId) {
                return response.json({
                    success: false,
                    message: "Username already exists"
                });
            }
        }

        // Find or create user profile
        let userProfile = await userProfileModel.findByUserId(userId);
        
        if (!userProfile) {
            // Create new profile if it doesn't exist
            userProfile = await userProfileModel.create({
                user_id: userId,
                username: username || `user_${userId}`,
                bio: bio || "",
                profile_picture: profile_picture || "",
                cover_picture: cover_photo || "",
                location: location || ""
            });
        } else {
            // Update existing profile
            const updateData = {};
            if (username) updateData.username = username;
            if (bio !== undefined) updateData.bio = bio;
            if (location !== undefined) updateData.location = location;
            if (profile_picture !== undefined) updateData.profile_picture = profile_picture;
            if (cover_photo !== undefined) updateData.cover_picture = cover_photo;

            userProfile = await userProfileModel.update(userId, updateData);
        }

        // Get updated follower and following counts
        const followersCount = await UserConnectionModel.getFollowersCount(userId);
        const followingCount = await UserConnectionModel.getFollowingCount(userId);

        response.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                username: userProfile.username,
                bio: userProfile.bio,
                profile_picture: userProfile.profile_picture,
                cover_picture: userProfile.cover_picture,
                location: userProfile.location,
                followers_count: followersCount,
                following_count: followingCount,
            }
        });

    } catch (error) {
        return response.json({
            success: false,
            message: error.message
        });
    }
}

export const updateUsername = async (request, response) => {
    try {
        const userId = request.user.id;
        const { username } = request.body;

        if (!username) {
            return response.json({
                success: false,
                message: "Username is required"
            });
        }

        // Username validation
        if (username.length < 3) {
            return response.json({
                success: false,
                message: "Username must be at least 3 characters long"
            });
        }
        if (username.length > 30) {
            return response.json({
                success: false,
                message: "Username must be less than 30 characters"
            });
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return response.json({
                success: false,
                message: "Username can only contain letters, numbers, and underscores"
            });
        }

        // Check if username already exists
        const existingProfile = await userProfileModel.findByUsername(username);
        if (existingProfile && existingProfile.user_id !== userId) {
            return response.json({
                success: false,
                message: "Username already exists"
            });
        }

        // Find or create user profile
        let userProfile = await userProfileModel.findByUserId(userId);
        
        if (!userProfile) {
            // Create new profile if it doesn't exist
            userProfile = await userProfileModel.create({
                user_id: userId,
                username: username
            });
        } else {
            // Update existing profile
            userProfile = await userProfileModel.update(userId, { username: username });
        }

        response.json({
            success: true,
            message: "Username updated successfully",
            data: {
                username: userProfile.username
            }
        });

    } catch (error) {
        return response.json({
            success: false,
            message: error.message
        });
    }
}