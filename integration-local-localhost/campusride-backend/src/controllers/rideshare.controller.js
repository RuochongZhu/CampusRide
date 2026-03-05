import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';
import socketManager from '../config/socket.js';
import wechatLinkService from '../services/wechat-link.service.js';

// 创建拼车行程
export const createRide = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      departureLocation,
      destinationLocation,
      departureTime,
      arrivalTime,
      availableSeats,
      pricePerSeat,
      recurringType = 'once',
      rules = []
    } = req.body;

    // 基础验证
    if (!title || !departureLocation || !destinationLocation || !departureTime || !availableSeats || !pricePerSeat) {
      throw new AppError('Missing required fields', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 验证时间
    const depTime = new Date(departureTime);
    if (depTime <= new Date()) {
      throw new AppError('Departure time must be in the future', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 验证座位数和价格
    if (availableSeats < 1 || availableSeats > 8) {
      throw new AppError('Available seats must be between 1 and 8', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (pricePerSeat < 0) {
      throw new AppError('Price per seat must be positive', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 创建拼车行程
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        driver_id: userId,
        title,
        description,
        departure_location: departureLocation,
        destination_location: destinationLocation,
        departure_time: depTime.toISOString(),
        arrival_time: arrivalTime ? new Date(arrivalTime).toISOString() : null,
        available_seats: availableSeats,
        price_per_seat: pricePerSeat,
        recurring_type: recurringType,
        rules: rules,
        status: 'active'
      })
      .select(`
        *,
        driver:users!driver_id(id, first_name, last_name, university)
      `)
      .single();

    if (error) {
      throw new AppError('Failed to create ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 创建微信通知记录（深链接到具体详情）
    try {
      const rideH5Link = `https://www.campusgo.college/rideshare/${ride.id}`;
      const rideLink = await wechatLinkService.getBestNoticeLink(rideH5Link);
      const routeSummary = `${departureLocation} → ${destinationLocation}`;
      const noticeContent = `打车发布  ${title}  ${routeSummary}\n${rideLink}`;

      await supabaseAdmin
        .from('wxgroup_notice_record')
        .insert({
          content: noticeContent
        });
    } catch (noticeError) {
      console.warn('Failed to create wxgroup notice for ride:', noticeError);
    }

    // 奖励创建拼车积分 (调用Claude Code的积分服务)
    try {
      await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/points/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
        },
        body: JSON.stringify({
          userId,
          points: 10,
          source: 'rideshare',
          description: '发布拼车行程'
        })
      });
    } catch (error) {
      console.warn('Failed to award points for ride creation:', error);
    }

    res.status(201).json({
      success: true,
      data: { ride },
      message: 'Ride created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 搜索拼车行程
export const getRides = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      departure,
      destination,
      date,
      minSeats,
      maxPrice,
      university
    } = req.query;

    // 构建查询条件
    let query = supabaseAdmin
      .from('rides')
      .select(`
        *,
        driver:users!driver_id(id, first_name, last_name, university, points),
        bookings:ride_bookings(count)
      `)
      .eq('status', 'active')
      .gte('departure_time', new Date().toISOString()); // 只显示未来的行程

    // 添加筛选条件
    if (departure) {
      query = query.ilike('departure_location->>address', `%${departure}%`);
    }
    if (destination) {
      query = query.ilike('destination_location->>address', `%${destination}%`);
    }
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query = query.gte('departure_time', startOfDay.toISOString())
                  .lt('departure_time', endOfDay.toISOString());
    }
    if (minSeats) {
      query = query.gte('available_seats', parseInt(minSeats));
    }
    if (maxPrice) {
      query = query.lte('price_per_seat', parseFloat(maxPrice));
    }
    if (university) {
      query = query.eq('driver.university', university);
    }

    // 分页
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
                 .order('departure_time', { ascending: true });

    const { data: rides, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch rides', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 计算实际可用座位数
    const ridesWithAvailableSeats = rides.map(ride => ({
      ...ride,
      remaining_seats: ride.available_seats - (ride.bookings?.[0]?.count || 0)
    }));

    res.json({
      success: true,
      data: {
        rides: ridesWithAvailableSeats,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || rides.length,
          has_next: rides.length === parseInt(limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个拼车行程详情
export const getRideById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .select(`
        *,
        driver:users!driver_id(id, first_name, last_name, university, points),
        bookings:ride_bookings(
          id, seats_booked, status, payment_status, created_at,
          passenger:users!passenger_id(id, first_name, last_name, university)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 计算剩余座位
    const bookedSeats = ride.bookings
      ?.filter(booking => booking.status !== 'cancelled')
      ?.reduce((sum, booking) => sum + booking.seats_booked, 0) || 0;
    
    ride.remaining_seats = ride.available_seats - bookedSeats;

    res.json({
      success: true,
      data: { ride }
    });
  } catch (error) {
    next(error);
  }
};

// 更新拼车行程
export const updateRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // 检查行程是否存在且属于当前用户
    const { data: existingRide, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('driver_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingRide) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (existingRide.driver_id !== userId) {
      throw new AppError('Not authorized to update this ride', 403, ERROR_CODES.ACCESS_DENIED);
    }

    if (existingRide.status === 'completed' || existingRide.status === 'cancelled') {
      throw new AppError('Cannot update completed or cancelled ride', 400, ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    // 更新行程
    const { data: updatedRide, error } = await supabaseAdmin
      .from('rides')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        driver:users!driver_id(id, first_name, last_name, university)
      `)
      .single();

    if (error) {
      throw new AppError('Failed to update ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 通知已预订的乘客
    socketManager.sendRideshareUpdate(id, {
      type: 'ride_updated',
      ride: updatedRide
    });

    res.json({
      success: true,
      data: { ride: updatedRide },
      message: 'Ride updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 删除拼车行程
export const deleteRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查权限
    const { data: ride, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('driver_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (ride.driver_id !== userId) {
      throw new AppError('Not authorized to delete this ride', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 标记为已取消而不是删除
    const { error } = await supabaseAdmin
      .from('rides')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to cancel ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 通知已预订的乘客
    socketManager.sendRideshareUpdate(id, {
      type: 'ride_cancelled',
      rideId: id
    });

    res.json({
      success: true,
      message: 'Ride cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 预订拼车
export const bookRide = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;
    const { seatsBooked = 1, pickupLocation, specialRequests } = req.body;

    // 检查行程是否存在和可用
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('*, driver_id, available_seats, price_per_seat, status')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (ride.driver_id === userId) {
      throw new AppError('Cannot book your own ride', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (ride.status !== 'active') {
      throw new AppError('Ride is not available for booking', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 检查是否已经预订过
    const { data: existingBooking } = await supabaseAdmin
      .from('ride_bookings')
      .select('id')
      .eq('ride_id', rideId)
      .eq('passenger_id', userId)
      .eq('status', 'confirmed')
      .single();

    if (existingBooking) {
      throw new AppError('You have already booked this ride', 400, ERROR_CODES.RESOURCE_CONFLICT);
    }

    // 检查剩余座位
    const { data: currentBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('seats_booked')
      .eq('ride_id', rideId)
      .neq('status', 'cancelled');

    const totalBookedSeats = currentBookings?.reduce((sum, booking) => sum + booking.seats_booked, 0) || 0;
    const remainingSeats = ride.available_seats - totalBookedSeats;

    if (seatsBooked > remainingSeats) {
      throw new AppError(`Only ${remainingSeats} seats available`, 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 创建预订
    const totalPrice = ride.price_per_seat * seatsBooked;
    const { data: booking, error } = await supabaseAdmin
      .from('ride_bookings')
      .insert({
        ride_id: rideId,
        passenger_id: userId,
        seats_booked: seatsBooked,
        total_price: totalPrice,
        pickup_location: pickupLocation,
        special_requests: specialRequests,
        status: 'confirmed', // 简化流程，直接确认
        payment_status: 'paid' // 简化支付流程
      })
      .select(`
        *,
        ride:rides(title, departure_time),
        passenger:users!passenger_id(first_name, last_name)
      `)
      .single();

    if (error) {
      throw new AppError('Failed to create booking', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 检查是否座位已满，更新行程状态
    if (remainingSeats === seatsBooked) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'full' })
        .eq('id', rideId);
    }

    // 通知司机有新预订
    socketManager.sendNotificationToUser(ride.driver_id, {
      type: 'ride_booking',
      title: '新的拼车预订',
      content: `${req.user.first_name} 预订了您的拼车`,
      data: { rideId, bookingId: booking.id }
    });

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Ride booked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 获取我的拼车行程(作为司机)
export const getMyRides = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('rides')
      .select(`
        *,
        bookings:ride_bookings(
          id, seats_booked, status, total_price,
          passenger:users!passenger_id(id, first_name, last_name)
        )
      `)
      .eq('driver_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
                 .order('created_at', { ascending: false });

    const { data: rides, error } = await query;

    if (error) {
      throw new AppError('Failed to fetch rides', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { rides }
    });
  } catch (error) {
    next(error);
  }
};

// 获取我的预订(作为乘客)
export const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('ride_bookings')
      .select(`
        *,
        ride:rides(
          id, title, departure_location, destination_location, departure_time,
          driver:users!driver_id(id, first_name, last_name)
        )
      `)
      .eq('passenger_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1)
                 .order('created_at', { ascending: false });

    const { data: bookings, error } = await query;

    if (error) {
      throw new AppError('Failed to fetch bookings', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

// 取消预订
export const cancelBooking = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user.id;

    // 检查预订是否存在且属于当前用户
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('ride_bookings')
      .select('*, ride:rides(driver_id, departure_time)')
      .eq('id', bookingId)
      .eq('passenger_id', userId)
      .single();

    if (fetchError || !booking) {
      throw new AppError('Booking not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (booking.status === 'cancelled') {
      throw new AppError('Booking already cancelled', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 检查是否可以取消(出发前2小时)
    const departureTime = new Date(booking.ride.departure_time);
    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      throw new AppError('Cannot cancel booking less than 2 hours before departure', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 取消预订
    const { error } = await supabaseAdmin
      .from('ride_bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      throw new AppError('Failed to cancel booking', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 通知司机
    socketManager.sendNotificationToUser(booking.ride.driver_id, {
      type: 'booking_cancelled',
      title: '拼车预订已取消',
      content: `${req.user.first_name} 取消了拼车预订`,
      data: { bookingId }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 完成拼车行程
export const completeRide = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const userId = req.user.id;

    // 检查权限
    const { data: ride, error: fetchError } = await supabaseAdmin
      .from('rides')
      .select('driver_id, status')
      .eq('id', rideId)
      .single();

    if (fetchError || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (ride.driver_id !== userId) {
      throw new AppError('Only the driver can complete the ride', 403, ERROR_CODES.ACCESS_DENIED);
    }

    if (ride.status !== 'active' && ride.status !== 'full') {
      throw new AppError('Ride cannot be completed', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 更新行程状态
    const { error } = await supabaseAdmin
      .from('rides')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId);

    if (error) {
      throw new AppError('Failed to complete ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 更新预订状态
    await supabaseAdmin
      .from('ride_bookings')
      .update({ status: 'completed' })
      .eq('ride_id', rideId)
      .neq('status', 'cancelled');

    // 奖励完成拼车积分 (调用Claude Code的积分服务)
    try {
      await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/points/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
        },
        body: JSON.stringify({
          userId,
          points: 15,
          source: 'rideshare',
          description: '完成拼车行程'
        })
      });
    } catch (error) {
      console.warn('Failed to award points for ride completion:', error);
    }

    // 通知所有乘客
    socketManager.sendRideshareUpdate(rideId, {
      type: 'ride_completed',
      rideId
    });

    res.json({
      success: true,
      message: 'Ride completed successfully'
    });
  } catch (error) {
    next(error);
  }
}; 
