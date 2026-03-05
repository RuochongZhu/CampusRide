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
} from '../controllers/carpooling.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, optionalAuth, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rides management
// POST /api/v1/carpooling/rides (requires registered user)
router.post('/rides', authenticateToken, requireRegisteredUser, asyncHandler(createRide));

// GET /api/v1/carpooling/rides - Search rides (guests can view)
router.get('/rides', optionalAuth, asyncHandler(getRides));

// GET /api/v1/carpooling/rides/:id (guests can view)
router.get('/rides/:id', optionalAuth, asyncHandler(getRideById));

// PUT /api/v1/carpooling/rides/:id (requires registered user)
router.put('/rides/:id', authenticateToken, requireRegisteredUser, asyncHandler(updateRide));

// DELETE /api/v1/carpooling/rides/:id (requires registered user)
router.delete('/rides/:id', authenticateToken, requireRegisteredUser, asyncHandler(deleteRide));

// My rides (as driver) (requires registered user)
// GET /api/v1/carpooling/my-rides
router.get('/my-rides', authenticateToken, requireRegisteredUser, asyncHandler(getMyRides));

// Booking management
// POST /api/v1/carpooling/rides/:id/book (requires registered user)
router.post('/rides/:id/book', authenticateToken, requireRegisteredUser, asyncHandler(bookRide));

// GET /api/v1/carpooling/my-bookings (requires registered user)
router.get('/my-bookings', authenticateToken, requireRegisteredUser, asyncHandler(getMyBookings));

// DELETE /api/v1/carpooling/bookings/:id (requires registered user)
router.delete('/bookings/:id', authenticateToken, requireRegisteredUser, asyncHandler(cancelBooking));

// POST /api/v1/carpooling/rides/:id/complete (requires registered user)
router.post('/rides/:id/complete', authenticateToken, requireRegisteredUser, asyncHandler(completeRide));

export default router;
