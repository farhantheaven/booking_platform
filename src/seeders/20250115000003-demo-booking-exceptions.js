'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    // Calculate dates for examples
    const nextMonday = new Date(tomorrow.getTime());
    while (nextMonday.getDay() !== 1) { // 1 = Monday
      nextMonday.setDate(nextMonday.getDate() + 1);
    }
    
    const nextTuesday = new Date(nextMonday.getTime() + 24 * 60 * 60 * 1000);
    const nextWednesday = new Date(nextMonday.getTime() + 2 * 24 * 60 * 60 * 1000);
    const nextFriday = new Date(nextMonday.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    // Christmas and New Year examples (for holiday scenarios)
    const christmasDate = new Date(nextMonday.getFullYear(), 11, 25); // December 25th
    const newYearDate = new Date(nextMonday.getFullYear(), 0, 1); // January 1st

    await queryInterface.bulkInsert('booking_exceptions', [
      // ===== CANCELLATION EXCEPTIONS =====
      
      // Cancel Daily Standup on Christmas (holiday)
      {
        id: '550e8400-e29b-41d4-a716-446655440100',
        booking_id: '550e8400-e29b-41d4-a716-446655440060', // Monday instance
        exception_date: christmasDate,
        exception_type: 'cancelled',
        new_start_time: null,
        new_end_time: null,
        new_title: null,
        new_description: null,
        created_at: now,
      },
      
      // Cancel Daily Standup on New Year's Day
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        booking_id: '550e8400-e29b-41d4-a716-446655440061', // Tuesday instance
        exception_date: newYearDate,
        exception_type: 'cancelled',
        new_start_time: null,
        new_end_time: null,
        new_title: null,
        new_description: null,
        created_at: now,
      },
      
      // Cancel Weekly All-Hands on holiday week
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        booking_id: '550e8400-e29b-41d4-a716-446655440070', // Friday instance
        exception_date: new Date(christmasDate.getTime() + 2 * 24 * 60 * 60 * 1000), // Friday after Christmas
        exception_type: 'cancelled',
        new_start_time: null,
        new_end_time: null,
        new_title: null,
        new_description: null,
        created_at: now,
      },

      // ===== MODIFICATION EXCEPTIONS =====
      
      // Modify Daily Standup on Wednesday (different time and title)
      {
        id: '550e8400-e29b-41d4-a716-446655440110',
        booking_id: '550e8400-e29b-41d4-a716-446655440062', // Wednesday instance
        exception_date: nextWednesday,
        exception_type: 'modified',
        new_start_time: new Date(nextWednesday.getFullYear(), nextWednesday.getMonth(), nextWednesday.getDate(), 10, 0, 0),
        new_end_time: new Date(nextWednesday.getFullYear(), nextWednesday.getMonth(), nextWednesday.getDate(), 10, 45, 0),
        new_title: 'Extended Standup - Sprint Review Prep',
        new_description: 'Extended standup meeting to prepare for sprint review and planning',
        created_at: now,
      },
      
      // Modify Daily Standup on Friday (different time only)
      {
        id: '550e8400-e29b-41d4-a716-446655440111',
        booking_id: '550e8400-e29b-41d4-a716-446655440070', // Weekly All-Hands Friday instance
        exception_date: nextFriday,
        exception_type: 'modified',
        new_start_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 16, 30, 0),
        new_end_time: new Date(nextFriday.getFullYear(), nextFriday.getMonth(), nextFriday.getDate(), 17, 30, 0),
        new_title: 'Extended All-Hands - Q4 Planning',
        new_description: 'Extended weekly meeting to include Q4 planning discussion',
        created_at: now,
      },
      
      // Modify Monthly Board Meeting (different time and description)
      {
        id: '550e8400-e29b-41d4-a716-446655440112',
        booking_id: '550e8400-e29b-41d4-a716-446655440080', // Monthly Board Meeting instance
        exception_date: nextMonday,
        exception_type: 'modified',
        new_start_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 14, 0, 0),
        new_end_time: new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 16, 30, 0),
        new_title: 'Monthly Board Meeting - Q4 Review',
        new_description: 'Extended board meeting for Q4 financial review and strategic planning',
        created_at: now,
      },

      // ===== SPECIAL SCENARIOS =====
      
      // Cancel Bi-weekly Sprint Planning (team off-site)
      {
        id: '550e8400-e29b-41d4-a716-446655440120',
        booking_id: '550e8400-e29b-41d4-a716-446655440050', // Sprint Planning parent rule
        exception_date: new Date(nextMonday.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks later
        exception_type: 'cancelled',
        new_start_time: null,
        new_end_time: null,
        new_title: null,
        new_description: null,
        created_at: now,
      },
      
      // Modify Project Planning Meeting (stakeholder unavailable)
      {
        id: '550e8400-e29b-41d4-a716-446655440121',
        booking_id: '550e8400-e29b-41d4-a716-446655440010', // Project Planning Meeting
        exception_date: tomorrow,
        exception_type: 'modified',
        new_start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0, 0),
        new_end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0, 0),
        new_title: 'Project Planning Meeting - Rescheduled',
        new_description: 'Meeting rescheduled due to stakeholder availability. Duration reduced to 1 hour.',
        created_at: now,
      },
      
      // Cancel Code Review Session (developer sick)
      {
        id: '550e8400-e29b-41d4-a716-446655440122',
        booking_id: '550e8400-e29b-41d4-a716-446655440011', // Code Review Session
        exception_date: dayAfterTomorrow,
        exception_type: 'cancelled',
        new_start_time: null,
        new_end_time: null,
        new_title: null,
        new_description: null,
        created_at: now,
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('booking_exceptions', null, {});
  }
}; 