import { DataTypes, Model, Optional } from 'sequelize';

// Define the interface for BookingException attributes
export interface BookingExceptionAttributes {
  id: string;
  booking_id: string;
  exception_date: Date;
  exception_type: 'cancelled' | 'modified';
  new_start_time?: Date;
  new_end_time?: Date;
  new_title?: string;
  new_description?: string;
  created_at: Date;
}

// Define creation attributes
interface BookingExceptionCreationAttributes extends Optional<BookingExceptionAttributes, 
  'id' | 'created_at' | 'new_start_time' | 'new_end_time' | 'new_title' | 'new_description'
> {}

// Define the Sequelize model class
class BookingException extends Model<BookingExceptionAttributes, BookingExceptionCreationAttributes> implements BookingExceptionAttributes {
  public id!: string;
  public booking_id!: string;
  public exception_date!: Date;
  public exception_type!: 'cancelled' | 'modified';
  public new_start_time?: Date;
  public new_end_time?: Date;
  public new_title?: string;
  public new_description?: string;
  public created_at!: Date;

  // Associations
  public getBooking!: any;
  public setBooking!: any;

  // Instance methods
  public isCancelled(): boolean {
    return this.exception_type === 'cancelled';
  }

  public isModified(): boolean {
    return this.exception_type === 'modified';
  }

  public hasTimeChange(): boolean {
    return this.isModified() && (this.new_start_time !== undefined || this.new_end_time !== undefined);
  }

  public hasContentChange(): boolean {
    return this.isModified() && (this.new_title !== undefined || this.new_description !== undefined);
  }
}

// Factory function to initialize the model
export const initializeBookingExceptionModel = (sequelize: any) => {
  BookingException.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      booking_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      exception_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      exception_type: {
        type: DataTypes.ENUM('cancelled', 'modified'),
        allowNull: false,
        validate: {
          isIn: [['cancelled', 'modified']],
        },
      },
      new_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isValidForModified(value: Date) {
            if (this.exception_type === 'modified' && !value) {
              throw new Error('Modified exceptions must have new start time');
            }
            if (this.exception_type === 'cancelled' && value) {
              throw new Error('Cancelled exceptions should not have new start time');
            }
          },
        },
      },
      new_end_time: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isValidForModified(value: Date) {
            if (this.exception_type === 'modified' && !value) {
              throw new Error('Modified exceptions must have new end time');
            }
            if (this.exception_type === 'cancelled' && value) {
              throw new Error('Cancelled exceptions should not have new start time');
            }
          },
          isAfterStartTime(value: Date) {
            if (value && this.new_start_time && value <= this.new_start_time) {
              throw new Error('New end time must be after new start time');
            }
          },
        },
      },
      new_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [1, 255],
        },
      },
      new_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'booking_exceptions',
      modelName: 'BookingException',
      timestamps: false, // Only created_at, no updated_at for exceptions
      underscored: true,
      validate: {
        modifiedExceptionValid() {
          if (this.exception_type === 'modified') {
            if (!this.new_start_time || !this.new_end_time) {
              throw new Error('Modified exceptions must have new start and end times');
            }
            if (this.new_start_time >= this.new_end_time) {
              throw new Error('New start time must be before new end time');
            }
          }
        },
        cancelledExceptionValid() {
          if (this.exception_type === 'cancelled') {
            if (this.new_start_time || this.new_end_time || this.new_title || this.new_description) {
              throw new Error('Cancelled exceptions should not have new values');
            }
          }
        },
      },
      indexes: [
        {
          name: 'idx_exceptions_booking_date',
          fields: ['booking_id', 'exception_date'],
          unique: true, // One exception per booking per date
        },
        {
          name: 'idx_exceptions_type',
          fields: ['exception_type'],
        },
        {
          name: 'idx_exceptions_date',
          fields: ['exception_date'],
        },
      ],
    }
  );

  return BookingException;
};

export default BookingException;