import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';
import notificationService from '../services/notification.service.js';

const RIDE_RATING_REMINDER_DELAY_MS = 2 * 60 * 60 * 1000;

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
      vehicleInfo,
      preferences,
      contactInfo,
      recurringType = 'once',
      rules = [],
      rideType = 'offer',
      flexibility
    } = req.body;

    // 基础验证
    if (!title || !departureLocation || !destinationLocation || !departureTime || !availableSeats || pricePerSeat === undefined) {
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
    const insertData = {
      driver_id: userId,
      title,
      description,
      departure_location: departureLocation,
      destination_location: destinationLocation,
      departure_time: depTime.toISOString(),
      arrival_time: arrivalTime ? new Date(arrivalTime).toISOString() : null,
      available_seats: availableSeats,
      price_per_seat: pricePerSeat,
      vehicle_info: vehicleInfo || {},
      preferences: preferences || {},
      contact_info: contactInfo || {},
      recurring_type: recurringType,
      rules: rules,
      status: 'active'
    };

    // 注意: ride_type 和 flexibility 字段需要先在数据库中添加
    // ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type VARCHAR(20) DEFAULT 'offer';
    // ALTER TABLE rides ADD COLUMN IF NOT EXISTS flexibility TEXT;

    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert(insertData)
      .select(`
        *,
        driver:users!driver_id(id, first_name, last_name, university, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating ride:', error);
      throw new AppError('Failed to create ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 创建微信通知记录（深链接到具体详情）
    try {
      const rideLink = `https://www.campusgo.college/rideshare/${ride.id}`;
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
    const userId = req.user?.id; // Get user ID from authenticated user (optional)
    const {
      page = 1,
      limit = 20,
      departure,
      destination,
      date,
      minSeats,
      maxPrice,
      timeFrom,
      timeTo,
      noSmoking,
      petsAllowed,
      sortBy = 'time_asc'
    } = req.query;

    // 构建查询条件
    let query = supabaseAdmin
      .from('rides')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .gte('departure_time', new Date().toISOString()); // 只显示未来的行程

    // 添加筛选条件
    if (departure && destination && req.query.searchMode === 'keyword') {
      // 关键词搜索模式：在出发地或目的地中搜索
      query = query.or(`departure_location.ilike.%${departure}%,destination_location.ilike.%${destination}%,title.ilike.%${departure}%`);
    } else {
      if (departure) {
        query = query.ilike('departure_location', `%${departure}%`);
      }
      if (destination) {
        query = query.ilike('destination_location', `%${destination}%`);
      }
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

    // Advanced filters
    if (noSmoking === 'true') {
      query = query.or('allow_smoking.is.null,allow_smoking.eq.false');
    }
    if (petsAllowed === 'true') {
      query = query.eq('pets_allowed', true);
    }

    // Time range filtering (if both timeFrom and timeTo are provided)
    // Note: This requires extracting time from departure_time timestamp
    // For simplicity, we'll handle this in post-processing if needed

    // 分页
    const offset = (page - 1) * limit;

    // Sorting
    let orderColumn = 'departure_time';
    let orderAscending = true;

    switch (sortBy) {
      case 'price_asc':
        orderColumn = 'price_per_seat';
        orderAscending = true;
        break;
      case 'price_desc':
        orderColumn = 'price_per_seat';
        orderAscending = false;
        break;
      case 'time_asc':
        orderColumn = 'departure_time';
        orderAscending = true;
        break;
      case 'time_desc':
        orderColumn = 'departure_time';
        orderAscending = false;
        break;
      case 'rating_desc':
        // Will need to join with user ratings later
        orderColumn = 'departure_time';
        orderAscending = true;
        break;
    }

    query = query.range(offset, offset + parseInt(limit) - 1)
                 .order(orderColumn, { ascending: orderAscending });

    let { data: rides, error, count } = await query;

    if (error) {
      console.error('Error fetching rides:', error);
      throw new AppError('Failed to fetch rides', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 如果没有rides,直接返回
    if (!rides || rides.length === 0) {
      return res.json({
        success: true,
        data: {
          rides: [],
          pagination: {
            current_page: parseInt(page),
            items_per_page: parseInt(limit),
            total_items: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false
          }
        }
      });
    }

    // 获取所有driver信息和bookings信息
    const rideIds = rides.map(r => r.id);
    const driverIds = [...new Set(rides.map(r => r.driver_id))];

    // 批量获取driver信息
    const { data: drivers } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, university, avatar_url, points')
      .in('id', driverIds);

    // 批量获取bookings信息
    const { data: allBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('ride_id, seats_booked, status, passenger_id')
      .in('ride_id', rideIds)
      .neq('status', 'cancelled');

    // 获取当前用户的预订信息 (如果已认证)
    let userBookings = [];
    if (userId) {
      const { data: currentUserBookings } = await supabaseAdmin
        .from('ride_bookings')
        .select('ride_id, status')
        .in('ride_id', rideIds)
        .eq('passenger_id', userId)
        .neq('status', 'cancelled');

      userBookings = currentUserBookings || [];
    }

    // 组装数据
    const ridesWithDetails = rides.map(ride => {
      // 找到对应的driver
      const driver = drivers?.find(d => d.id === ride.driver_id);

      // 找到对应的bookings
      const bookings = allBookings?.filter(b => b.ride_id === ride.id) || [];
      const bookedSeats = bookings.reduce((sum, booking) => sum + booking.seats_booked, 0);

      // 检查当前用户是否已预订
      const userBooking = userBookings.find(b => b.ride_id === ride.id);
      const isBookedByUser = !!userBooking;

      return {
        ...ride,
        driver: driver || null,
        bookings: bookings,
        booked_seats: bookedSeats,
        remaining_seats: ride.available_seats - bookedSeats,
        is_booked_by_user: isBookedByUser,
        user_booking_status: userBooking?.status || null
      };
    });

    res.json({
      success: true,
      data: {
        rides: ridesWithDetails,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || 0,
          total_pages: Math.ceil((count || 0) / parseInt(limit)),
          has_next: (parseInt(page) * parseInt(limit)) < (count || 0),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('getRides error:', error);
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
        driver:users!driver_id(id, first_name, last_name, university, avatar_url, points),
        bookings:ride_bookings(
          id, seats_booked, status, payment_status, created_at,
          passenger:users!passenger_id(id, first_name, last_name, university, avatar_url)
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

    ride.booked_seats = bookedSeats;
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
        driver:users!driver_id(id, first_name, last_name, university, avatar_url)
      `)
      .single();

    if (error) {
      throw new AppError('Failed to update ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: { ride: updatedRide },
      message: 'Ride updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 删除/取消拼车行程
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
    const { seatsBooked = 1, pickupLocation, specialRequests, contactNumber } = req.body;

    if (!contactNumber) {
      throw new AppError('Contact number is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

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
      .neq('status', 'cancelled')
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
        status: 'confirmed',
        payment_status: 'paid'
      })
      .select(`
        *,
        ride:rides(title, departure_time, departure_location, destination_location),
        passenger:users!passenger_id(first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw new AppError('Failed to create booking', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 检查是否座位已满,更新行程状态
    if (remainingSeats === seatsBooked) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'full' })
        .eq('id', rideId);
    }

    const passengerName = [req.user?.first_name, req.user?.last_name].filter(Boolean).join(' ') || 'A rider';

    // 给司机一个消息式提示：有人报名了 Ride
    await notificationService.sendNotification({
      userId: ride.driver_id,
      type: 'ride_new_booking',
      title: 'Your ride has a new booking',
      content: `${passengerName} booked ${seatsBooked} seat(s) on "${ride.title}".`,
      data: {
        rideId,
        bookingId: booking.id,
        passengerId: userId,
        trigger: 'ride_booking'
      },
      priority: 'high'
    });

    // 给乘客一个确认提示，方便在消息页看到最近行程
    await notificationService.sendNotification({
      userId,
      type: 'ride_booking_confirmed',
      title: 'Ride booking confirmed',
      content: `You are confirmed for "${ride.title}".`,
      data: {
        rideId,
        bookingId: booking.id,
        driverId: ride.driver_id,
        trigger: 'ride_booking_confirmed'
      },
      priority: 'medium'
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
          passenger:users!passenger_id(id, first_name, last_name, avatar_url)
        )
      `, { count: 'exact' })
      .eq('driver_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1)
                 .order('created_at', { ascending: false });

    const { data: rides, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch rides', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || 0
        }
      }
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
          driver:users!driver_id(id, first_name, last_name, avatar_url)
        )
      `, { count: 'exact' })
      .eq('passenger_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1)
                 .order('created_at', { ascending: false });

    const { data: bookings, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch bookings', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: count || 0
        }
      }
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
      .select('*, ride:rides(driver_id, departure_time, status)')
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

    // 如果行程之前是满的,现在取消后重新设为active
    if (booking.ride.status === 'full') {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'active' })
        .eq('id', booking.ride_id);
    }

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
      .select('driver_id, status, title, departure_time, driver:users!driver_id(first_name, last_name)')
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

    const { data: activeBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select(`
        id,
        passenger_id,
        passenger:users!passenger_id(first_name, last_name)
      `)
      .eq('ride_id', rideId)
      .neq('status', 'cancelled');

    // 更新预订状态
    await supabaseAdmin
      .from('ride_bookings')
      .update({ status: 'completed' })
      .eq('ride_id', rideId)
      .neq('status', 'cancelled');

    const reminderAt = new Date(Date.now() + RIDE_RATING_REMINDER_DELAY_MS).toISOString();
    const driverName = [ride.driver?.first_name, ride.driver?.last_name].filter(Boolean).join(' ') || 'Driver';

    // 先给乘客发送完成提示 + 延时评分提醒
    for (const booking of (activeBookings || [])) {
      const passengerName = [booking.passenger?.first_name, booking.passenger?.last_name].filter(Boolean).join(' ') || 'Passenger';

      await notificationService.sendNotification({
        userId: booking.passenger_id,
        type: 'ride_completed',
        title: 'Ride completed',
        content: `Your ride "${ride.title}" has been completed.`,
        data: {
          rideId,
          bookingId: booking.id,
          trigger: 'ride_completed'
        },
        priority: 'medium'
      });

      await notificationService.sendNotification({
        userId: booking.passenger_id,
        type: 'ride_rating_reminder',
        title: 'Rate your ride in 5-star system',
        content: `Please rate ${driverName} for "${ride.title}". Your rating goes into the 5-star trust score.`,
        data: {
          rideId,
          rateeId: ride.driver_id,
          roleOfRater: 'passenger',
          showAfter: reminderAt,
          trigger: 'ride_rating_reminder'
        },
        priority: 'high'
      });

      // 给司机发每位乘客的评分提醒（同样延时）
      await notificationService.sendNotification({
        userId: ride.driver_id,
        type: 'ride_rating_reminder',
        title: 'Rate your passenger in 5-star system',
        content: `Please rate ${passengerName} for "${ride.title}". This impacts the 5-star trust score.`,
        data: {
          rideId,
          rateeId: booking.passenger_id,
          roleOfRater: 'driver',
          showAfter: reminderAt,
          trigger: 'ride_rating_reminder'
        },
        priority: 'high'
      });
    }

    res.json({
      success: true,
      message: 'Ride completed successfully'
    });
  } catch (error) {
    next(error);
  }
};
