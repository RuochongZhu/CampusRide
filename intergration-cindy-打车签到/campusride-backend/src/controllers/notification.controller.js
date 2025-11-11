import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';

// 获取当前用户的通知（司机视角）
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, type, unreadOnly } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('driver_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1)
                 .order('created_at', { ascending: false });

    const { data: notifications, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch notifications', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 为每个通知获取相关的乘客和行程信息
    if (notifications && notifications.length > 0) {
      const passengerIds = [...new Set(notifications.map(n => n.passenger_id))];
      const tripIds = [...new Set(notifications.map(n => n.trip_id))];

      // 获取乘客信息
      const { data: passengers } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, avatar_url, email')
        .in('id', passengerIds);

      // 获取行程信息
      const { data: trips } = await supabaseAdmin
        .from('rides')
        .select('id, title, departure_location, destination_location, departure_time')
        .in('id', tripIds);

      // 组合数据
      for (const notification of notifications) {
        notification.passenger = passengers?.find(p => p.id === notification.passenger_id);
        notification.trip = trips?.find(t => t.id === notification.trip_id);
      }
    }

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || 0,
          unread_count: notifications?.filter(n => !n.is_read).length || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取未读通知数量
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError('Failed to fetch unread count', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: {
        unread_count: count || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 司机响应预订请求（接受或拒绝）
export const respondToNotification = async (req, res, next) => {
  try {
    const { id: notificationId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;

    if (!action || !['accept', 'reject'].includes(action)) {
      throw new AppError('Action must be either "accept" or "reject"', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 获取通知信息
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      throw new AppError('Notification not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 验证通知属于当前用户（司机）
    if (notification.driver_id !== userId) {
      throw new AppError('Not authorized to respond to this notification', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 验证通知状态
    if (notification.status !== 'pending') {
      throw new AppError('This notification has already been responded to', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (action === 'accept') {
      // 接受预订 - 使用事务逻辑防止超卖
      
      // 1. 获取预订信息
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('ride_bookings')
        .select('id, ride_id, seats_booked, status')
        .eq('id', notification.booking_id)
        .single();

      if (bookingError || !booking) {
        throw new AppError('Booking not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      if (booking.status !== 'pending') {
        throw new AppError('This booking has already been processed', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // 2. 获取行程信息
      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .select('id, available_seats, status')
        .eq('id', notification.trip_id)
        .single();

      if (rideError || !ride) {
        throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // 3. 检查行程是否已满或不可用
      if (ride.status === 'full') {
        throw new AppError('This ride is already fully booked', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      if (ride.status !== 'active') {
        throw new AppError('This ride is no longer available', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // 4. 计算当前已确认的座位（防止并发超卖）
      const { data: confirmedBookings } = await supabaseAdmin
        .from('ride_bookings')
        .select('seats_booked')
        .eq('ride_id', notification.trip_id)
        .eq('status', 'confirmed');

      const totalConfirmedSeats = confirmedBookings?.reduce((sum, b) => sum + b.seats_booked, 0) || 0;
      const remainingSeats = ride.available_seats - totalConfirmedSeats;

      // 5. 检查是否还有足够座位
      if (booking.seats_booked > remainingSeats) {
        throw new AppError(`Cannot accept: only ${remainingSeats} seats remaining, but booking requests ${booking.seats_booked} seats`, 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // 6. 更新预订状态为 confirmed（真正占座）
      const { error: updateBookingError } = await supabaseAdmin
        .from('ride_bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.booking_id)
        .eq('status', 'pending');  // 再次检查状态，防止并发

      if (updateBookingError) {
        throw new AppError('Failed to confirm booking', 500, ERROR_CODES.DATABASE_ERROR, updateBookingError);
      }

      // 7. 检查是否满员，如果满员则更新行程状态
      const newTotalSeats = totalConfirmedSeats + booking.seats_booked;
      if (newTotalSeats >= ride.available_seats) {
        const { error: updateRideError } = await supabaseAdmin
          .from('rides')
          .update({ 
            status: 'full',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.trip_id);

        if (updateRideError) {
          console.error('Failed to update ride status to full:', updateRideError);
        } else {
          console.log(`✅ Ride ${notification.trip_id} is now FULL (${newTotalSeats}/${ride.available_seats} seats)`);
        }
      }

      // 8. 更新通知状态
      const { error: updateNotifError } = await supabaseAdmin
        .from('notifications')
        .update({ 
          status: 'accepted',
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (updateNotifError) {
        console.error('Failed to update notification:', updateNotifError);
      }

      // 9. 创建确认通知给乘客
      const { error: confirmNotifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'booking_confirmed',
          trip_id: notification.trip_id,
          driver_id: notification.driver_id,
          passenger_id: notification.passenger_id,
          booking_id: notification.booking_id,
          status: 'accepted',
          message: 'Your booking request has been confirmed by the driver!',
          is_read: false
        });

      if (confirmNotifError) {
        console.error('Failed to create confirmation notification:', confirmNotifError);
      }

      res.json({
        success: true,
        data: { 
          notification,
          ride_status: newTotalSeats >= ride.available_seats ? 'full' : 'active',
          seats_info: {
            booked: newTotalSeats,
            total: ride.available_seats,
            remaining: ride.available_seats - newTotalSeats
          }
        },
        message: 'Booking request accepted successfully'
      });

    } else {
      // 拒绝预订
      // 1. 更新通知状态
      const { error: updateNotifError } = await supabaseAdmin
        .from('notifications')
        .update({ 
          status: 'rejected',
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (updateNotifError) {
        throw new AppError('Failed to update notification', 500, ERROR_CODES.DATABASE_ERROR, updateNotifError);
      }

      // 2. 删除或标记预订为 rejected
      if (notification.booking_id) {
        const { error: deleteBookingError } = await supabaseAdmin
          .from('ride_bookings')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.booking_id);

        if (deleteBookingError) {
          console.error('Failed to cancel booking:', deleteBookingError);
        }
      }

      // 3. 创建拒绝通知给乘客
      const { error: rejectNotifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'booking_rejected',
          trip_id: notification.trip_id,
          driver_id: notification.driver_id,
          passenger_id: notification.passenger_id,
          booking_id: notification.booking_id,
          status: 'rejected',
          message: 'Your booking request has been declined by the driver.',
          is_read: false
        });

      if (rejectNotifError) {
        console.error('Failed to create rejection notification:', rejectNotifError);
      }

      res.json({
        success: true,
        data: { notification },
        message: 'Booking request rejected'
      });
    }
  } catch (error) {
    next(error);
  }
};

// 标记通知为已读
export const markAsRead = async (req, res, next) => {
  try {
    const { id: notificationId } = req.params;
    const userId = req.user.id;

    // 验证通知属于当前用户
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('driver_id, passenger_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      throw new AppError('Notification not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (notification.driver_id !== userId && notification.passenger_id !== userId) {
      throw new AppError('Not authorized to update this notification', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 更新为已读
    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (updateError) {
      throw new AppError('Failed to mark notification as read', 500, ERROR_CODES.DATABASE_ERROR, updateError);
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// 标记所有通知为已读
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError('Failed to mark all notifications as read', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// 获取乘客的通知（预订确认/拒绝）
export const getPassengerNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('passenger_id', userId)
      .in('type', ['booking_confirmed', 'booking_rejected', 'trip_update', 'trip_cancelled']);

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1)
                 .order('created_at', { ascending: false });

    const { data: notifications, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch notifications', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 获取司机和行程信息
    if (notifications && notifications.length > 0) {
      const driverIds = [...new Set(notifications.map(n => n.driver_id))];
      const tripIds = [...new Set(notifications.map(n => n.trip_id))];

      const { data: drivers } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, avatar_url')
        .in('id', driverIds);

      const { data: trips } = await supabaseAdmin
        .from('rides')
        .select('id, title, departure_location, destination_location, departure_time')
        .in('id', tripIds);

      for (const notification of notifications) {
        notification.driver = drivers?.find(d => d.id === notification.driver_id);
        notification.trip = trips?.find(t => t.id === notification.trip_id);
      }
    }

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || 0,
          unread_count: notifications?.filter(n => !n.is_read).length || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
