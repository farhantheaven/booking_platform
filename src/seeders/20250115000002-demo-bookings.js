'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    // Calculate next Monday for recurring examples
    const nextMonday = new Date(tomorrow);
    while (nextMonday.getDay() !== 1) { // 1 = Monday
      nextMonday.setDate(nextMonday.getDate() + 1);
    }
    
    // Calculate next Friday for weekly meetings
    const nextFriday = new Date(tomorrow);
    while (nextFriday.getDay() !== 5) { // 5 = Friday
      nextFriday.setDate(nextFriday.getDate() + 1);
    }

    await queryInterface.bulkInsert('bookings', [
      // ===== SINGLE BOOKINGS =====
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        resource_id: '550e8400-e29b-41d4-a716-446655440001', // Conference Room A
        title: 'Project Planning Meeting',
        description: 'Quarterly project planning session with stakeholders and product team',
        start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0, 0),
        end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: null,
        series_id: null,
        original_start_time: null,
        created_by: 'admin@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        resource_id: '550e8400-e29b-41d4-a716-446655440003', // John Doe
        title: 'Code Review Session',
        description: 'One-on-one code review with senior developer for new feature implementation',
        start_time: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 10, 0, 0),
        end_time: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 11, 0, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: null,
        series_id: null,
        original_start_time: null,
        created_by: 'developer@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        resource_id: '550e8400-e29b-41d4-a716-446655440005', // Phone Booth 1
        title: 'Client Call',
        description: 'Confidential discussion with enterprise client about project requirements',
        start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0, 0),
        end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 30, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: null,
        series_id: null,
        original_start_time: null,
        created_by: 'sales@example.com',
        created_at: now,
        updated_at: now,
      },

      // ===== RECURRING BOOKINGS (PARENT RULES) =====
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        resource_id: '550e8400-e29b-41d4-a716-446655440002', // Conference Room B
        title: 'Daily Standup',
        description: 'Daily development team standup meeting for project updates and blockers',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 30, 0),
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;COUNT=50',
        recurrence_parent_id: null,
        series_id: '550e8400-e29b-41d4-a716-446655440021',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0),
        created_by: 'scrum-master@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440030',
        resource_id: '550e8400-e29b-41d4-a716-446655440004', // Training Room
        title: 'Weekly All-Hands Meeting',
        description: 'Company-wide weekly meeting for updates, announcements, and team building',
        start_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 16, 0, 0),
        end_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 17, 0, 0),
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=FR;COUNT=26',
        recurrence_parent_id: null,
        series_id: '550e8400-e29b-41d4-a716-446655440031',
        original_start_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 16, 0, 0),
        created_by: 'ceo@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        resource_id: '550e8400-e29b-41d4-a716-446655440001', // Conference Room A
        title: 'Monthly Board Meeting',
        description: 'Monthly board of directors meeting for strategic decisions and company review',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 13, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 15, 0, 0),
        is_recurring: true,
        recurrence_rule: 'FREQ=MONTHLY;INTERVAL=1;BYDAY=MO;BYSETPOS=1;COUNT=12',
        recurrence_parent_id: null,
        series_id: '550e8400-e29b-41d4-a716-446655440041',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 13, 0, 0),
        created_by: 'board@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440050',
        resource_id: '550e8400-e29b-41d4-a716-446655440002', // Conference Room B
        title: 'Bi-weekly Sprint Planning',
        description: 'Agile sprint planning session for development team',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 10, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 12, 0, 0),
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;COUNT=26',
        recurrence_parent_id: null,
        series_id: '550e8400-e29b-41d4-a716-446655440051',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 10, 0, 0),
        created_by: 'product-manager@example.com',
        created_at: now,
        updated_at: now,
      },

      // ===== RECURRING BOOKING INSTANCES =====
      // Daily Standup instances (first week)
      {
        id: '550e8400-e29b-41d4-a716-446655440060',
        resource_id: '550e8400-e29b-41d4-a716-446655440002', // Conference Room B
        title: 'Daily Standup',
        description: 'Daily development team standup meeting for project updates and blockers',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 30, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: '550e8400-e29b-41d4-a716-446655440020',
        series_id: '550e8400-e29b-41d4-a716-446655440021',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0),
        created_by: 'scrum-master@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440061',
        resource_id: '550e8400-e29b-41d4-a716-446655440002', // Conference Room B
        title: 'Daily Standup',
        description: 'Daily development team standup meeting for project updates and blockers',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 1, 9, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 1, 9, 30, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: '550e8400-e29b-41d4-a716-446655440020',
        series_id: '550e8400-e29b-41d4-a716-446655440021',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0),
        created_by: 'scrum-master@example.com',
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440062',
        resource_id: '550e8400-e29b-41d4-a716-446655440002', // Conference Room B
        title: 'Daily Standup',
        description: 'Daily development team standup meeting for project updates and blockers',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 2, 9, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 2, 9, 30, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: '550e8400-e29b-41d4-a716-446655440020',
        series_id: '550e8400-e29b-41d4-a716-446655440021',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0),
        created_by: 'scrum-master@example.com',
        created_at: now,
        updated_at: now,
      },

      // Weekly All-Hands instance
      {
        id: '550e8400-e29b-41d4-a716-446655440070',
        resource_id: '550e8400-e29b-41d4-a716-446655440004', // Training Room
        title: 'Weekly All-Hands Meeting',
        description: 'Company-wide weekly meeting for updates, announcements, and team building',
        start_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 16, 0, 0),
        end_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 17, 0, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: '550e8400-e29b-41d4-a716-446655440030',
        series_id: '550e8400-e29b-41d4-a716-446655440031',
        original_start_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 16, 0, 0),
        created_by: 'ceo@example.com',
        created_at: now,
        updated_at: now,
      },

      // Monthly Board Meeting instance
      {
        id: '550e8400-e29b-41d4-a716-446655440080',
        resource_id: '550e8400-e29b-41d4-a716-446655440001', // Conference Room A
        title: 'Monthly Board Meeting',
        description: 'Monthly board of directors meeting for strategic decisions and company review',
        start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 13, 0, 0),
        end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 15, 0, 0),
        is_recurring: false,
        recurrence_rule: null,
        recurrence_parent_id: '550e8400-e29b-41d4-a716-446655440040',
        series_id: '550e8400-e29b-41d4-a716-446655440041',
        original_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 13, 0, 0),
        created_by: 'board@example.com',
        created_at: now,
        updated_at: now,
      },
    ], {});

    // ===== BOOKING EXCEPTIONS =====
    await queryInterface.bulkInsert('booking_exceptions', [
      // Cancel one instance of Daily Standup (e.g., holiday)
      {
        id: '550e8400-e29b-41d4-a716-446655440090',
        booking_id: '550e8400-e29b-41d4-a716-446655440061', // Tuesday instance
        exception_date: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 1),
        exception_type: 'cancelled',
        new_start_time: null,
        new_end_time: null,
        new_title: null,
        new_description: null,
        created_at: now,
      },
      // Modify one instance of Daily Standup (e.g., different time)
      {
        id: '550e8400-e29b-41d4-a716-446655440091',
        booking_id: '550e8400-e29b-41d4-a716-446655440062', // Wednesday instance
        exception_date: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 2),
        exception_type: 'modified',
        new_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 2, 10, 0, 0),
        new_end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate() + 2, 10, 30, 0),
        new_title: 'Extended Standup - Sprint Review Prep',
        new_description: 'Extended standup to prepare for sprint review meeting',
        created_at: now,
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order due to foreign key constraints
    await queryInterface.bulkDelete('booking_exceptions', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
  }
};