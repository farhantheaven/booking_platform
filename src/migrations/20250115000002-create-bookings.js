'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'resources',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        // Force UTC storage without timezone conversion
        field: 'start_time',
        comment: 'Stored in UTC without timezone information'
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
        // Force UTC storage without timezone conversion
        field: 'end_time',
        comment: 'Stored in UTC without timezone information'
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      recurrence_rule: {
        type: Sequelize.TEXT,
        allowNull: true,
        //FREQ=DAILY;INTERVAL=1;BYHOUR=9;BYMINUTE=0
        //FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0
        //FREQ=MONTHLY;INTERVAL=1;BYDAY=1MO;BYHOUR=9;BYMINUTE=0
        //FREQ=YEARLY;INTERVAL=1;BYDAY=1MO;BYHOUR=9;BYMINUTE=0
        //FREQ=DAILY;INTERVAL=1;BYHOUR=9;BYMINUTE=0
        //FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0
        //FREQ=MONTHLY;INTERVAL=1;BYDAY=1MO;BYHOUR=9;BYMINUTE=0
        //FREQ=YEARLY;INTERVAL=1;BYDAY=1MO;BYHOUR=9;BYMINUTE=0
      },
      recurrence_parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      series_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for optimal performance
    await queryInterface.addIndex('bookings', ['resource_id', 'start_time', 'end_time'], {
      name: 'idx_bookings_resource_time',
    });

    await queryInterface.addIndex('bookings', ['series_id'], {
      name: 'idx_bookings_series',
      where: {
        series_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    await queryInterface.addIndex('bookings', ['recurrence_parent_id'], {
      name: 'idx_bookings_parent',
      where: {
        recurrence_parent_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    await queryInterface.addIndex('bookings', ['start_time', 'end_time'], {
      name: 'idx_bookings_time_range',
    });

    await queryInterface.addIndex('bookings', ['is_recurring'], {
      name: 'idx_bookings_is_recurring',
    });

    // Add check constraints for data integrity
    await queryInterface.addConstraint('bookings', {
      fields: ['start_time', 'end_time'],
      type: 'check',
      name: 'valid_time_range',
      where: {
        end_time: {
          [Sequelize.Op.gt]: Sequelize.col('start_time'),
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bookings');
  }
};