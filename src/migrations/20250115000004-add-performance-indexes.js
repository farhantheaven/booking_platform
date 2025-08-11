'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add composite indexes for common query patterns
    await queryInterface.addIndex('bookings', ['resource_id', 'start_time', 'end_time'], {
      name: 'idx_bookings_resource_time_range',
      using: 'BTREE'
    });

    await queryInterface.addIndex('bookings', ['resource_id', 'is_recurring', 'recurrence_rule'], {
      name: 'idx_bookings_recurring_pattern',
      using: 'BTREE'
    });

    await queryInterface.addIndex('bookings', ['series_id', 'start_time'], {
      name: 'idx_bookings_series_time',
      using: 'BTREE'
    });

    await queryInterface.addIndex('booking_exceptions', ['booking_id', 'exception_date'], {
      name: 'idx_exceptions_booking_date',
      using: 'BTREE'
    });

    // Add partial indexes for active bookings only
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY idx_bookings_active 
      ON bookings (resource_id, start_time, end_time) 
      WHERE is_deleted = false
    `);

    // Add GIN index for full-text search on titles
    await queryInterface.addIndex('bookings', ['title'], {
      name: 'idx_bookings_title_gin',
      using: 'GIN',
      operator: 'gin_trgm_ops'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('bookings', 'idx_bookings_resource_time_range');
    await queryInterface.removeIndex('bookings', 'idx_bookings_recurring_pattern');
    await queryInterface.removeIndex('bookings', 'idx_bookings_series_time');
    await queryInterface.removeIndex('booking_exceptions', 'idx_exceptions_booking_date');
    await queryInterface.removeIndex('bookings', 'idx_bookings_title_gin');
    
    // Drop partial index
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_bookings_active
    `);
  }
}; 