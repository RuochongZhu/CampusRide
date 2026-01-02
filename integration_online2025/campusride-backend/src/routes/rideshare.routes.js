import express from 'express';
import { 
  createRide, 
  getRides, 
  getRideById, 
  updateRide, 
  deleteRide,
  bookRide,
  getMyRides,
  getMyBookings,
  cancelBooking,
  completeRide
} from '../controllers/rideshare.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// All rideshare routes require authentication
router.use(authenticateToken);

// Rides management
// POST /api/v1/rideshare/rides (requires registered user)
router.post('/rides', requireRegisteredUser, asyncHandler(createRide));

// GET /api/v1/rideshare/rides - Search rides (guests can view)
router.get('/rides', asyncHandler(getRides));

// GET /api/v1/rideshare/rides/:id (guests can view)
router.get('/rides/:id', asyncHandler(getRideById));

// PUT /api/v1/rideshare/rides/:id (requires registered user)
router.put('/rides/:id', requireRegisteredUser, asyncHandler(updateRide));

// DELETE /api/v1/rideshare/rides/:id (requires registered user)
router.delete('/rides/:id', requireRegisteredUser, asyncHandler(deleteRide));

// My rides (as driver) (requires registered user)
// GET /api/v1/rideshare/my-rides
router.get('/my-rides', requireRegisteredUser, asyncHandler(getMyRides));

// Booking management
// POST /api/v1/rideshare/rides/:id/book (requires registered user)
router.post('/rides/:id/book', requireRegisteredUser, asyncHandler(bookRide));

// GET /api/v1/rideshare/my-bookings (requires registered user)
router.get('/my-bookings', requireRegisteredUser, asyncHandler(getMyBookings));

// DELETE /api/v1/rideshare/bookings/:id (requires registered user)
router.delete('/bookings/:id', requireRegisteredUser, asyncHandler(cancelBooking));

// POST /api/v1/rideshare/rides/:id/complete (requires registered user)
router.post('/rides/:id/complete', requireRegisteredUser, asyncHandler(completeRide));

export default router; 