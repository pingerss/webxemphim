'use strict';

/**
 * Models index - định nghĩa TẤT CẢ associations (quan hệ)
 * Import file này một lần duy nhất, sau đó dùng { ModelName } từ đây.
 */

const { sequelize } = require('../config/database');

const MembershipTier    = require('./MembershipTier');
const User              = require('./User');
const Genre             = require('./Genre');
const Director          = require('./Director');
const Actor             = require('./Actor');
const Movie             = require('./Movie');
const { MovieGenre, MovieActor } = require('./MovieMeta');
const MovieReview       = require('./MovieReview');
const Cinema            = require('./Cinema');
const Room              = require('./Room');
const SeatType          = require('./SeatType');
const Seat              = require('./Seat');
const Showtime          = require('./Showtime');
const Combo             = require('./Combo');
const Promotion         = require('./Promotion');
const Voucher           = require('./Voucher');
const Booking           = require('./Booking');
const { BookingTicket, BookingCombo } = require('./BookingDetail');
const Payment           = require('./Payment');

// ── User & Auth ────────────────────────────────────────────
MembershipTier.hasMany(User, { foreignKey: 'membership_tier_id' });
User.belongsTo(MembershipTier, { foreignKey: 'membership_tier_id', as: 'membershipTier' });

// ── Movie Catalog ──────────────────────────────────────────
Director.hasMany(Movie, { foreignKey: 'director_id', as: 'movies' });
Movie.belongsTo(Director, { foreignKey: 'director_id', as: 'director' });

Movie.belongsToMany(Genre, { through: MovieGenre, foreignKey: 'movie_id', as: 'genres' });
Genre.belongsToMany(Movie, { through: MovieGenre, foreignKey: 'genre_id', as: 'movies' });

Movie.belongsToMany(Actor, { through: MovieActor, foreignKey: 'movie_id', as: 'actors' });
Actor.belongsToMany(Movie, { through: MovieActor, foreignKey: 'actor_id', as: 'movies' });

Movie.hasMany(MovieReview, { foreignKey: 'movie_id', as: 'reviews' });
MovieReview.belongsTo(Movie, { foreignKey: 'movie_id' });
User.hasMany(MovieReview, { foreignKey: 'user_id' });
MovieReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Cinema & Scheduling ────────────────────────────────────
Cinema.hasMany(Room, { foreignKey: 'cinema_id', as: 'rooms' });
Room.belongsTo(Cinema, { foreignKey: 'cinema_id', as: 'cinema' });

Room.hasMany(Seat, { foreignKey: 'room_id', as: 'seats' });
Seat.belongsTo(Room, { foreignKey: 'room_id' });

SeatType.hasMany(Seat, { foreignKey: 'seat_type_id' });
Seat.belongsTo(SeatType, { foreignKey: 'seat_type_id', as: 'seatType' });

Movie.hasMany(Showtime, { foreignKey: 'movie_id', as: 'showtimes' });
Showtime.belongsTo(Movie, { foreignKey: 'movie_id', as: 'movie' });

Room.hasMany(Showtime, { foreignKey: 'room_id', as: 'showtimes' });
Showtime.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// ── Booking ────────────────────────────────────────────────
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Showtime.hasMany(Booking, { foreignKey: 'showtime_id', as: 'bookings' });
Booking.belongsTo(Showtime, { foreignKey: 'showtime_id', as: 'showtime' });

Voucher.hasMany(Booking, { foreignKey: 'voucher_id' });
Booking.belongsTo(Voucher, { foreignKey: 'voucher_id', as: 'voucher' });

Booking.hasMany(BookingTicket, { foreignKey: 'booking_id', as: 'tickets' });
BookingTicket.belongsTo(Booking, { foreignKey: 'booking_id' });

Seat.hasMany(BookingTicket, { foreignKey: 'seat_id' });
BookingTicket.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });

Booking.hasMany(BookingCombo, { foreignKey: 'booking_id', as: 'combos' });
BookingCombo.belongsTo(Booking, { foreignKey: 'booking_id' });

Combo.hasMany(BookingCombo, { foreignKey: 'combo_id' });
BookingCombo.belongsTo(Combo, { foreignKey: 'combo_id', as: 'combo' });

// ── Payment ────────────────────────────────────────────────
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });

// ── Promotion & Voucher ────────────────────────────────────
Promotion.hasMany(Voucher, { foreignKey: 'promotion_id', as: 'vouchers' });
Voucher.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });

module.exports = {
  sequelize,
  MembershipTier,
  User,
  Genre,
  Director,
  Actor,
  Movie,
  MovieGenre,
  MovieActor,
  MovieReview,
  Cinema,
  Room,
  SeatType,
  Seat,
  Showtime,
  Combo,
  Promotion,
  Voucher,
  Booking,
  BookingTicket,
  BookingCombo,
  Payment,
};
