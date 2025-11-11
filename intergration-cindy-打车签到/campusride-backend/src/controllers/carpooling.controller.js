import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';

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
      rules = []
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
    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .insert({
        driver_id: userId,
        title,
        description,
        departure_location: departureLocation,
        destination_location: destinationLocation,
        departure_time: departureTime,
        available_seats: availableSeats,
        price_per_seat: pricePerSeat,
        vehicle_info: vehicleInfo || {},
        preferences: preferences || {},
        contact_info: contactInfo || {},
        is_recurring: recurringType !== 'once',
        recurring_pattern: recurringType !== 'once' ? recurringType : null,
        status: 'active'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating ride:', error);
      throw new AppError('Failed to create ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 获取司机信息
    const { data: driver } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, university, avatar_url')
      .eq('id', userId)
      .single();

    // 添加司机信息到 ride 对象
    if (driver) {
      ride.driver = driver;
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

// 辅助函数：自动更新过期行程状态
const updateExpiredRidesStatus = async () => {
  const now = new Date().toISOString();
  
  // 1. 先找出所有过期的 active 行程
  const { data: expiredRides } = await supabaseAdmin
    .from('rides')
    .select('id')
    .eq('status', 'active')
    .lt('departure_time', now);
  
  if (expiredRides && expiredRides.length > 0) {
    const expiredRideIds = expiredRides.map(r => r.id);
    
    // 2. 查询这些行程中有已确认预订的
    const { data: ridesWithBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('ride_id')
      .in('ride_id', expiredRideIds)
      .eq('status', 'confirmed');
    
    const rideIdsWithBookings = ridesWithBookings ? [...new Set(ridesWithBookings.map(b => b.ride_id))] : [];
    const rideIdsWithoutBookings = expiredRideIds.filter(id => !rideIdsWithBookings.includes(id));
    
    // 3. 有预订的 → completed（已完成）
    if (rideIdsWithBookings.length > 0) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'completed' })
        .in('id', rideIdsWithBookings);
    }
    
    // 4. 无预订的 → expired（已过期）
    if (rideIdsWithoutBookings.length > 0) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'expired' })
        .in('id', rideIdsWithoutBookings);
    }
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
      maxPrice
    } = req.query;

    // 自动更新过期行程的状态
    await updateExpiredRidesStatus();

    // 构建查询条件
    let query = supabaseAdmin
      .from('rides')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .gte('departure_time', new Date().toISOString()); // 只显示未来的行程

    // 添加筛选条件
    if (departure) {
      query = query.ilike('departure_location', `%${departure}%`);
    }
    if (destination) {
      query = query.ilike('destination_location', `%${destination}%`);
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

    // 分页
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + parseInt(limit) - 1)
                 .order('departure_time', { ascending: true });

    const { data: rides, error, count } = await query;

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

    // 批量获取已确认的预订信息（只统计confirmed的座位）
    const { data: confirmedBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('ride_id, seats_booked, status')
      .in('ride_id', rideIds)
      .eq('status', 'confirmed');  // 只统计已确认的预订

    // 组装数据
    const ridesWithDetails = rides.map(ride => {
      // 找到对应的driver
      const driver = drivers?.find(d => d.id === ride.driver_id);

      // 计算已确认的座位
      const rideBookings = confirmedBookings?.filter(b => b.ride_id === ride.id) || [];
      const bookedSeats = rideBookings.reduce((sum, booking) => sum + booking.seats_booked, 0);
      const remainingSeats = ride.available_seats - bookedSeats;

      return {
        ...ride,
        driver: driver || null,
        booked_seats: bookedSeats,
        remaining_seats: remainingSeats
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
      .select('*')
      .eq('id', id)
      .single();

    if (error || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 获取司机信息
    const { data: driver } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, university, avatar_url, points')
      .eq('id', ride.driver_id)
      .single();

    if (driver) {
      ride.driver = driver;
    }

    // 获取预订信息
    const { data: bookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('id, seats_booked, status, payment_status, created_at, passenger_id')
      .eq('ride_id', id);

    // 为每个预订获取乘客信息
    if (bookings && bookings.length > 0) {
      const passengerIds = bookings.map(b => b.passenger_id);
      const { data: passengers } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, university, avatar_url')
        .in('id', passengerIds);

      // 将乘客信息添加到预订中
      ride.bookings = bookings.map(booking => ({
        ...booking,
        passenger: passengers?.find(p => p.id === booking.passenger_id)
      }));
    } else {
      ride.bookings = [];
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
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 获取司机信息
    const { data: driver } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, university, avatar_url')
      .eq('id', userId)
      .single();

    if (driver) {
      updatedRide.driver = driver;
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
      .select('driver_id, status, departure_time, title')
      .eq('id', id)
      .single();

    if (fetchError || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (ride.driver_id !== userId) {
      throw new AppError('Not authorized to delete this ride', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 检查是否可以取消（行程开始前）
    const departureTime = new Date(ride.departure_time);
    const now = new Date();

    if (now >= departureTime) {
      throw new AppError('Trip has started, cancellation is unavailable', 409, ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    // 获取所有相关的预订
    const { data: bookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('id, passenger_id, status')
      .eq('ride_id', id)
      .in('status', ['pending', 'confirmed']);

    // 获取司机信息
    const { data: driver } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    // 标记为已取消而不是删除
    const { error } = await supabaseAdmin
      .from('rides')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new AppError('Failed to cancel ride', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 更新所有相关预订为 cancelled
    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id);
      
      await supabaseAdmin
        .from('ride_bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', bookingIds);

      // 为每个乘客创建通知
      const notifications = bookings.map(booking => ({
        type: 'trip_canceled_by_driver',
        trip_id: id,
        driver_id: userId,
        passenger_id: booking.passenger_id,
        booking_id: booking.id,
        status: 'pending',
        message: `${driver?.first_name || 'Driver'} ${driver?.last_name || ''} canceled the trip "${ride.title}"`,
        is_read: false
      }));

      await supabaseAdmin
        .from('notifications')
        .insert(notifications);
    }

    res.json({
      success: true,
      message: 'Ride cancelled successfully',
      data: {
        notified_passengers: bookings?.length || 0
      }
    });
  } catch (error) {
    console.error('deleteRide error:', error);
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

    // 检查行程状态（full或已关闭的不能预订）
    if (ride.status === 'full') {
      throw new AppError('This ride is fully booked', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (ride.status !== 'active') {
      throw new AppError('Ride is not available for booking', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 检查是否已经预订过（包括pending的预订）
    const { data: existingBooking } = await supabaseAdmin
      .from('ride_bookings')
      .select('id, status')
      .eq('ride_id', rideId)
      .eq('passenger_id', userId)
      .neq('status', 'cancelled')
      .single();

    if (existingBooking) {
      if (existingBooking.status === 'pending') {
        throw new AppError('You already have a pending booking request for this ride', 400, ERROR_CODES.RESOURCE_CONFLICT);
      }
      throw new AppError('You have already booked this ride', 400, ERROR_CODES.RESOURCE_CONFLICT);
    }

    // 检查剩余座位（只统计已确认的预订）
    const { data: currentBookings } = await supabaseAdmin
      .from('ride_bookings')
      .select('seats_booked')
      .eq('ride_id', rideId)
      .eq('status', 'confirmed');  // 只统计confirmed的预订

    const totalBookedSeats = currentBookings?.reduce((sum, booking) => sum + booking.seats_booked, 0) || 0;
    const remainingSeats = ride.available_seats - totalBookedSeats;

    if (seatsBooked > remainingSeats) {
      throw new AppError(`Only ${remainingSeats} seats available`, 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 创建预订（状态为 pending，等待司机确认）
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
        status: 'pending',  // 改为 pending，等待司机确认
        payment_status: 'pending'  // 支付状态也改为 pending
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw new AppError('Failed to create booking', 500, ERROR_CODES.DATABASE_ERROR, error);
    }

    // 获取行程信息
    const { data: rideInfo } = await supabaseAdmin
      .from('rides')
      .select('title, departure_time, departure_location, destination_location')
      .eq('id', rideId)
      .single();

    if (rideInfo) {
      booking.ride = rideInfo;
    }

    // 获取乘客信息
    const { data: passenger } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, avatar_url')
      .eq('id', userId)
      .single();

    if (passenger) {
      booking.passenger = passenger;
    }

    // 创建通知给司机
    const notificationMessage = `${passenger?.first_name || 'A passenger'} ${passenger?.last_name || ''} requested to join your trip: ${rideInfo?.title || 'your trip'}`;
    
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_request',
        trip_id: rideId,
        driver_id: ride.driver_id,
        passenger_id: userId,
        booking_id: booking.id,
        status: 'pending',
        message: notificationMessage,
        is_read: false
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // 不阻止预订流程，只记录错误
    }

    // 检查是否座位已满,更新行程状态
    if (remainingSeats === seatsBooked) {
      await supabaseAdmin
        .from('rides')
        .update({ status: 'full' })
        .eq('id', rideId);
    }

    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Your booking request has been sent to the driver for confirmation.'
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
      .select('*', { count: 'exact' })
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

    // 为每个行程获取预订信息
    if (rides && rides.length > 0) {
      for (const ride of rides) {
        // 获取该行程的所有预订
        const { data: bookings } = await supabaseAdmin
          .from('ride_bookings')
          .select('id, seats_booked, status, total_price, passenger_id')
          .eq('ride_id', ride.id);

        if (bookings && bookings.length > 0) {
          // 获取所有乘客信息
          const passengerIds = bookings.map(b => b.passenger_id);
          const { data: passengers } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, avatar_url')
            .in('id', passengerIds);

          // 将乘客信息添加到预订中
          ride.bookings = bookings.map(booking => ({
            ...booking,
            passenger: passengers?.find(p => p.id === booking.passenger_id)
          }));
        } else {
          ride.bookings = [];
        }

        // 计算剩余座位
        const bookedSeats = ride.bookings
          ?.filter(booking => booking.status !== 'cancelled')
          ?.reduce((sum, booking) => sum + booking.seats_booked, 0) || 0;

        ride.booked_seats = bookedSeats;
        ride.remaining_seats = ride.available_seats - bookedSeats;
      }
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
      .select('*', { count: 'exact' })
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

    // 获取所有相关的行程信息
    if (bookings && bookings.length > 0) {
      const rideIds = bookings.map(b => b.ride_id);
      const { data: rides } = await supabaseAdmin
        .from('rides')
        .select('id, title, departure_location, destination_location, departure_time, driver_id')
        .in('id', rideIds);

      // 获取所有司机信息
      const driverIds = rides?.map(r => r.driver_id).filter(Boolean) || [];
      const { data: drivers } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, avatar_url')
        .in('id', driverIds);

      // 组合数据
      for (const booking of bookings) {
        const ride = rides?.find(r => r.id === booking.ride_id);
        if (ride) {
          const driver = drivers?.find(d => d.id === ride.driver_id);
          if (driver) {
            ride.driver = driver;
          }
          booking.ride = ride;
        }
      }
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

// 获取我的所有行程（合并 driver 和 passenger 视角）
export const getMyTrips = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    // 自动更新过期行程的状态
    await updateExpiredRidesStatus();

    const trips = [];
    
    // 1. 获取我作为司机的行程
    let driverQuery = supabaseAdmin
      .from('rides')
      .select('*', { count: 'exact' })
      .eq('driver_id', userId);

    if (status) {
      driverQuery = driverQuery.eq('status', status);
    }

    const { data: driverRides } = await driverQuery.order('departure_time', { ascending: false });

    if (driverRides && driverRides.length > 0) {
      for (const ride of driverRides) {
        // 获取该行程的所有预订
        const { data: bookings } = await supabaseAdmin
          .from('ride_bookings')
          .select('id, seats_booked, status, total_price, passenger_id')
          .eq('ride_id', ride.id);

        if (bookings && bookings.length > 0) {
          const passengerIds = bookings.map(b => b.passenger_id);
          const { data: passengers } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, avatar_url')
            .in('id', passengerIds);

          ride.bookings = bookings.map(booking => ({
            ...booking,
            passenger: passengers?.find(p => p.id === booking.passenger_id)
          }));
        } else {
          ride.bookings = [];
        }

        const confirmedBookedSeats = ride.bookings
          ?.filter(booking => booking.status === 'confirmed')
          ?.reduce((sum, booking) => sum + booking.seats_booked, 0) || 0;

        trips.push({
          ...ride,
          role: 'driver',
          booked_seats: confirmedBookedSeats,
          remaining_seats: ride.available_seats - confirmedBookedSeats
        });
      }
    }

    // 2. 获取我作为乘客的预订
    let passengerQuery = supabaseAdmin
      .from('ride_bookings')
      .select('*')
      .eq('passenger_id', userId);

    if (status) {
      passengerQuery = passengerQuery.eq('status', status);
    }

    const { data: passengerBookings } = await passengerQuery.order('created_at', { ascending: false });

    if (passengerBookings && passengerBookings.length > 0) {
      const rideIds = passengerBookings.map(b => b.ride_id);
      const { data: rides } = await supabaseAdmin
        .from('rides')
        .select('*')
        .in('id', rideIds);

      const driverIds = rides?.map(r => r.driver_id).filter(Boolean) || [];
      const { data: drivers } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, avatar_url, university')
        .in('id', driverIds);

      for (const booking of passengerBookings) {
        const ride = rides?.find(r => r.id === booking.ride_id);
        if (ride) {
          const driver = drivers?.find(d => d.id === ride.driver_id);
          
          trips.push({
            ...ride,
            role: 'passenger',
            booking_id: booking.id,
            booking_status: booking.status,
            seats_booked: booking.seats_booked,
            total_price: booking.total_price,
            driver: driver || null
          });
        }
      }
    }

    // 按出发时间排序
    trips.sort((a, b) => new Date(b.departure_time) - new Date(a.departure_time));

    // 手动分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTrips = trips.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        trips: paginatedTrips,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit),
          total_items: trips.length,
          total_pages: Math.ceil(trips.length / parseInt(limit)),
          has_next: endIndex < trips.length,
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('getMyTrips error:', error);
    next(error);
  }
};

// 取消预订（乘客取消）
export const cancelBooking = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user.id;

    // 获取预订信息
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('ride_bookings')
      .select('id, ride_id, passenger_id, seats_booked, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      throw new AppError('Booking not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 验证权限
    if (booking.passenger_id !== userId) {
      throw new AppError('Not authorized to cancel this booking', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 验证状态
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new AppError('Cannot cancel this booking', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 获取行程信息
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('driver_id, departure_time, status, available_seats')
      .eq('id', booking.ride_id)
      .single();

    if (rideError || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 检查是否可以取消（行程开始前）
    const departureTime = new Date(ride.departure_time);
    const now = new Date();

    if (now >= departureTime) {
      throw new AppError('Trip has started, cancellation is unavailable', 409, ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    // 更新预订状态
    const { error: updateError } = await supabaseAdmin
      .from('ride_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      throw new AppError('Failed to cancel booking', 500, ERROR_CODES.DATABASE_ERROR, updateError);
    }

    // 如果预订之前是confirmed，需要回退座位
    if (booking.status === 'confirmed') {
      // 计算当前已确认的座位数
      const { data: confirmedBookings } = await supabaseAdmin
        .from('ride_bookings')
        .select('seats_booked')
        .eq('ride_id', booking.ride_id)
        .eq('status', 'confirmed');

      const totalConfirmedSeats = confirmedBookings?.reduce((sum, b) => sum + b.seats_booked, 0) || 0;

      // 如果行程之前是full，现在有空位了，改回active
      if (ride.status === 'full' && totalConfirmedSeats < ride.available_seats) {
        await supabaseAdmin
          .from('rides')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.ride_id);
      }
    }

    // 创建通知给司机
    const { data: passenger } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_canceled',
        trip_id: booking.ride_id,
        driver_id: ride.driver_id,
        passenger_id: userId,
        booking_id: bookingId,
        status: 'pending',
        message: `${passenger?.first_name || 'A passenger'} ${passenger?.last_name || ''} canceled their booking`,
        is_read: false
      });

    res.json({
      success: true,
      message: 'Booking canceled'
    });
  } catch (error) {
    console.error('cancelBooking error:', error);
    next(error);
  }
};

// 司机取消某个预订
export const cancelBookingByDriver = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user.id;

    // 获取预订信息
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('ride_bookings')
      .select('id, ride_id, passenger_id, seats_booked, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      throw new AppError('Booking not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 获取行程信息
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('driver_id, departure_time, status, available_seats')
      .eq('id', booking.ride_id)
      .single();

    if (rideError || !ride) {
      throw new AppError('Ride not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 验证权限（只有司机可以取消）
    if (ride.driver_id !== userId) {
      throw new AppError('Only the driver can cancel this booking', 403, ERROR_CODES.ACCESS_DENIED);
    }

    // 检查是否可以取消（行程开始前）
    const departureTime = new Date(ride.departure_time);
    const now = new Date();

    if (now >= departureTime) {
      throw new AppError('Trip has started, cancellation is unavailable', 409, ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    // 更新预订状态
    const { error: updateError } = await supabaseAdmin
      .from('ride_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      throw new AppError('Failed to cancel booking', 500, ERROR_CODES.DATABASE_ERROR, updateError);
    }

    // 如果预订之前是confirmed，需要回退座位
    if (booking.status === 'confirmed') {
      const { data: confirmedBookings } = await supabaseAdmin
        .from('ride_bookings')
        .select('seats_booked')
        .eq('ride_id', booking.ride_id)
        .eq('status', 'confirmed');

      const totalConfirmedSeats = confirmedBookings?.reduce((sum, b) => sum + b.seats_booked, 0) || 0;

      if (ride.status === 'full' && totalConfirmedSeats < ride.available_seats) {
        await supabaseAdmin
          .from('rides')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.ride_id);
      }
    }

    // 创建通知给乘客
    await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_canceled_by_driver',
        trip_id: booking.ride_id,
        driver_id: userId,
        passenger_id: booking.passenger_id,
        booking_id: bookingId,
        status: 'pending',
        message: 'The driver canceled your booking',
        is_read: false
      });

    res.json({
      success: true,
      message: 'Booking canceled successfully'
    });
  } catch (error) {
    console.error('cancelBookingByDriver error:', error);
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

    res.json({
      success: true,
      message: 'Ride completed successfully'
    });
  } catch (error) {
    next(error);
  }
};
