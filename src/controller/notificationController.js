const { Notification, User, Enquiry } = require('../model');
const { Op } = require('sequelize');

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: userId };
    if (unread_only === 'true') {
      whereClause.is_read = false;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'role']
        },
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: notifications.rows,
      pagination: {
        total: notifications.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(notifications.count / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await Notification.findOne({
      where: {
        notification_id: id,
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ is_read: true });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Create notification for all users except CMO role
const createNotificationForAllExceptCMO = async (message, enquiryId = null, type = 'IN_APP') => {
  try {
    // Get all users except CMO role
    const users = await User.findAll({
      where: {
        role: {
          [Op.ne]: 'CMO'
        }
      },
      attributes: ['user_id']
    });

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.user_id,
      message,
      type,
      enquiry_id: enquiryId,
      status: 'SENT'
    }));

    await Notification.bulkCreate(notifications);

    console.log(`Created ${notifications.length} notifications for new enquiry`);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
};

// Create notification for specific users
const createNotificationForUsers = async (userIds, message, enquiryId = null, type = 'IN_APP') => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      message,
      type,
      enquiry_id: enquiryId,
      status: 'SENT'
    }));

    await Notification.bulkCreate(notifications);

    console.log(`Created ${notifications.length} notifications`);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const deleted = await Notification.destroy({
      where: {
        notification_id: id,
        user_id: userId
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotificationForAllExceptCMO,
  createNotificationForUsers,
  deleteNotification
};