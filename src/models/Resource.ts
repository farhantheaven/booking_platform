import { DataTypes, Model, Optional } from 'sequelize';

// Define the interface for Resource attributes
export interface ResourceAttributes {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  type?: string;
  location?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Define creation attributes (optional fields)
interface ResourceCreationAttributes extends Optional<ResourceAttributes, 
  'id' | 'created_at' | 'updated_at' | 'description' | 'capacity' | 'type' | 'location' | 'is_active' | 'is_deleted' | 'deleted_at'
> {}

// Define the Sequelize model class
class Resource extends Model<ResourceAttributes, ResourceCreationAttributes> implements ResourceAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public capacity?: number;
  public type?: string;
  public location?: string;
  public is_active?: boolean;
  public is_deleted?: boolean;
  public deleted_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public getBookings!: any;
  public hasBookings!: any;
  public countBookings!: any;
}

// Factory function to initialize the model
export const initializeResourceModel = (sequelize: any) => {
  Resource.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
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
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 1000,
        },
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
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
      tableName: 'resources',
      modelName: 'Resource',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          name: 'idx_resources_name',
          fields: ['name'],
        },
        {
          name: 'idx_resources_type',
          fields: ['type', 'is_active'],
        },
        {
          name: 'idx_resources_location',
          fields: ['location', 'is_active'],
        },
      ],
    }
  );

  return Resource;
};

export default Resource;