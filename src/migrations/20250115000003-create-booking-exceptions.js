'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('booking_exceptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      exception_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      exception_type: {
        type: Sequelize.ENUM('cancelled', 'modified'),
        allowNull: false,
      },
      new_start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      new_end_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      new_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      new_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add unique constraint - one exception per booking per date
    await queryInterface.addIndex('booking_exceptions', ['booking_id', 'exception_date'], {
      name: 'idx_exceptions_booking_date',
      unique: true,
    });

    // Add other indexes
    await queryInterface.addIndex('booking_exceptions', ['exception_type'], {
      name: 'idx_exceptions_type',
    });

    await queryInterface.addIndex('booking_exceptions', ['exception_date'], {
      name: 'idx_exceptions_date',
    });

    // Add check constraint for modified exceptions
    await queryInterface.addConstraint('booking_exceptions', {
      fields: ['exception_type', 'new_start_time', 'new_end_time'],
      type: 'check',
      name: 'valid_modified_exception',
      where: Sequelize.literal(`
        (exception_type = 'modified' AND new_start_time IS NOT NULL AND new_end_time IS NOT NULL) OR
        (exception_type = 'cancelled')
      `),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('booking_exceptions');
  }
};