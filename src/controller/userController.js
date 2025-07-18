const User = require("../model/User");
const District = require("../model/District");
const bcrypt = require("bcrypt");
const { ValidationError } = require('sequelize');

// Get all users (ADMIN only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password_hash"] }, // do not return password hashes
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['district_id', 'district_name']
        }
      ]
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      message: "Failed to fetch users",
      success: false,
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] }, // do not return password hash
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['district_id', 'district_name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Add district_name to user object for easier access
    const userData = user.toJSON();
    if (userData.district) {
      userData.district_name = userData.district.district_name;
    }

    return res.status(200).json({
      message: "User fetched successfully",
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      message: "Failed to fetch user",
      success: false,
      error: error.message
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, full_name, address } = req.body;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ 
        where: { username },
        attributes: ['user_id']
      });
      if (existingUsername && existingUsername.user_id !== parseInt(id)) {
        return res.status(400).json({
          message: "Username already exists",
          success: false
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        where: { email },
        attributes: ['user_id']
      });
      if (existingEmail && existingEmail.user_id !== parseInt(id)) {
        return res.status(400).json({
          message: "Email already exists",
          success: false
        });
      }
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (full_name) updateData.full_name = full_name;
    if (address) updateData.address = address;

    await user.update(updateData);

    // Fetch updated user with district info
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['district_id', 'district_name']
        }
      ]
    });

    const userData = updatedUser.toJSON();
    if (userData.district) {
      userData.district_name = userData.district.district_name;
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      data: userData
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: "Validation error",
        success: false,
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    console.error('Update user profile error:', error);
    return res.status(500).json({
      message: "Failed to update profile",
      success: false,
      error: error.message
    });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
        success: false
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
        success: false
      });
    }

    // Find user with password hash
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
        success: false
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password_hash: newPasswordHash });

    return res.status(200).json({
      message: "Password changed successfully",
      success: true
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      message: "Failed to change password",
      success: false,
      error: error.message
    });
  }
};

// Delete user (ADMIN only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    await user.destroy();

    return res.status(200).json({
      message: "User deleted successfully",
      success: true
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      message: "Failed to delete user",
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  changePassword,
  deleteUser
};
