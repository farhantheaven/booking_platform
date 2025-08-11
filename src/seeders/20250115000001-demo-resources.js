'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('resources', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Conference Room A',
        description: 'Large conference room with projector and whiteboard. Seats up to 20 people.',
        capacity: 20,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Conference Room B',
        description: 'Small meeting room perfect for team discussions. Seats up to 8 people.',
        capacity: 8,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'John Doe',
        description: 'Senior Software Developer available for one-on-one meetings and consultations.',
        capacity: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Training Room',
        description: 'Large training room with presentation equipment. Seats up to 30 people.',
        capacity: 30,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Phone Booth 1',
        description: 'Private phone booth for confidential calls.',
        capacity: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('resources', null, {});
  }
};