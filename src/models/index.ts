import { Sequelize } from 'sequelize';

// Import models and their factory functions
import Resource, { initializeResourceModel } from './Resource';
import Booking, { initializeBookingModel } from './Booking';
import BookingException, { initializeBookingExceptionModel } from './BookingException';

// Define associations
const defineAssociations = () => {
  // Resource associations
  Resource.hasMany(Booking, {
    foreignKey: 'resource_id',
    as: 'bookings',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Booking associations
  Booking.belongsTo(Resource, {
    foreignKey: 'resource_id',
    as: 'resource',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Booking.hasMany(BookingException, {
    foreignKey: 'booking_id',
    as: 'exceptions',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Self-referential association for recurring bookings
  Booking.belongsTo(Booking, {
    foreignKey: 'recurrence_parent_id',
    as: 'parent',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Booking.hasMany(Booking, {
    foreignKey: 'recurrence_parent_id',
    as: 'children',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // BookingException associations
  BookingException.belongsTo(Booking, {
    foreignKey: 'booking_id',
    as: 'booking',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

// Initialize all models and associations
const initializeModels = async (sequelize: Sequelize) => {
  try {
    // Initialize all models with the Sequelize instance
    initializeResourceModel(sequelize);
    initializeBookingModel(sequelize);
    initializeBookingExceptionModel(sequelize);
    
    // Define associations
    defineAssociations();

    // Sync models in development (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ All models synchronized successfully');
    }

    console.log('✅ Models initialized with associations');
  } catch (error) {
    console.error('❌ Error initializing models:', error);
    throw error;
  }
};

// Export models and utility functions
export {
  Resource,
  Booking,
  BookingException,
  initializeModels,
  defineAssociations,
};

// Export model interfaces for type safety
export type {
  ResourceAttributes,
} from './Resource';

export type {
  BookingAttributes,
} from './Booking';

export type {
  BookingExceptionAttributes,
} from './BookingException';

// Lazy Sequelize instance - only get when needed
export const getSequelizeInstance = () => {
  // This function should be called after the database is initialized
  throw new Error('getSequelizeInstance should not be called directly. Use the sequelize instance passed to initializeModels.');
};

// Helper function to get all models
export const getModels = () => ({
  Resource,
  Booking,
  BookingException,
});

// Note: These functions are no longer available since they require the sequelize instance
// Use the database connection methods directly instead