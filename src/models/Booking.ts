import { DataTypes, Model, Op, Optional } from 'sequelize';

// Define the interface for Booking attributes
export interface BookingAttributes {
  id: string;
  resource_id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  is_recurring: boolean;
  recurrence_rule?: string;
  recurrence_parent_id?: string;
  series_id?: string;
  original_start_time?: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Define creation attributes
interface BookingCreationAttributes extends Optional<BookingAttributes, 
  'id' | 'created_at' | 'updated_at' | 'description' | 'is_recurring' | 
  'recurrence_rule' | 'recurrence_parent_id' | 'series_id' | 'original_start_time' | 'created_by'
> {}

// Define the Sequelize model class
class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  public id!: string;
  public resource_id!: string;
  public title!: string;
  public description?: string;
  public start_time!: Date;
  public end_time!: Date;
  public is_recurring!: boolean;
  public recurrence_rule?: string;
  public recurrence_parent_id?: string;
  public series_id?: string;
  public original_start_time?: Date;
  public created_by?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public getResource!: any;
  public setResource!: any;
  public getExceptions!: any;
  public hasExceptions!: any;
  public countExceptions!: any;
  public getParent!: any;
  public getChildren!: any;

  // Instance methods
  public isOverlapping(otherStart: Date, otherEnd: Date): boolean {
    return this.start_time < otherEnd && this.end_time > otherStart;
  }

  public getDurationMinutes(): number {
    return Math.floor((this.end_time.getTime() - this.start_time.getTime()) / (1000 * 60));
  }

  public isInBusinessHours(): boolean {
    const startHour = this.start_time.getHours();
    const endHour = this.end_time.getHours();
    const dayOfWeek = this.start_time.getDay();
    
    // Business hours: 9 AM to 5 PM, Monday to Friday
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const startsAfter9AM = startHour >= 9;
    const endsBefore5PM = endHour <= 17;
    
    return isWeekday && startsAfter9AM && endsBefore5PM;
  }
}

// Factory function to initialize the model
export const initializeBookingModel = (sequelize: any) => {
  Booking.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      resource_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'resources',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
        // Custom setter to force UTC storage
        set(value: any) {
          if (value) {
            // Convert to UTC for storage
            // The input date is in user's timezone, we need to store it as UTC
            const utcDate = new Date(value);
            
            // If the input has timezone info (like +05:30), JavaScript will handle conversion
            // If it's a local time without timezone, we assume it's in the user's timezone
            // and store the corresponding UTC time
            this.setDataValue('start_time', utcDate);
          }
        },
        // Custom getter to ensure UTC display
        get() {
          const value = this.getDataValue('start_time');
          if (value) {
            // Return as UTC date
            return new Date(value.getTime());
          }
          return value;
        }
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
        // Custom setter to force UTC storage
        set(value: any) {
          if (value) {
            // Convert to UTC for storage
            // The input date is in user's timezone, we need to store it as UTC
            const utcDate = new Date(value);
            
            // If the input has timezone info (like +05:30), JavaScript will handle conversion
            // If it's a local time without timezone, we assume it's in the user's timezone
            // and store the corresponding UTC time
            this.setDataValue('end_time', utcDate);
          }
        },
        // Custom getter to ensure UTC display
        get() {
          const value = this.getDataValue('end_time');
          if (value) {
            // Return as UTC date
            return new Date(value.getTime());
          }
          return value;
        }
      },
      is_recurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      recurrence_rule: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isValidRRule(value: string) {
            if (this.is_recurring && !value) {
              throw new Error('Recurrence rule is required for recurring bookings');
            }
            if (!this.is_recurring && value) {
              throw new Error('Recurrence rule should not be set for non-recurring bookings');
            }
          },
        },
      },
      recurrence_parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      series_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      original_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'bookings',
      modelName: 'Booking',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      validate: {
        timeRangeValid(this: Booking) {
          if (this.start_time >= this.end_time) {
            throw new Error('Start time must be before end time');
          }
        },
        recurrenceConsistent() {
          if (this.is_recurring && !this.recurrence_rule) {
            throw new Error('Recurring bookings must have a recurrence rule');
          }
          if (!this.is_recurring && this.recurrence_rule) {
            throw new Error('Non-recurring bookings should not have a recurrence rule');
          }
        },
      },
      indexes: [
        {
          name: 'idx_bookings_resource_time',
          fields: ['resource_id', 'start_time', 'end_time'],
        },
        {
          name: 'idx_bookings_series',
          fields: ['series_id'],
          where: {
            series_id: {
              [Op.ne]: null,
            },
          },
        },
        {
          name: 'idx_bookings_parent',
          fields: ['recurrence_parent_id'],
          where: {
            recurrence_parent_id: {
              [Op.ne]: null,
            },
          },
        },
        {
          name: 'idx_bookings_time_range',
          fields: ['start_time', 'end_time'],
        },
        {
          name: 'idx_bookings_is_recurring',
          fields: ['is_recurring'],
        },
      ],
    }
  );

  return Booking;
};

export default Booking;