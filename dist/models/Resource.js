"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeResourceModel = void 0;
var sequelize_1 = require("sequelize");
// Define the Sequelize model class
var Resource = /** @class */ (function (_super) {
    __extends(Resource, _super);
    function Resource() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Resource;
}(sequelize_1.Model));
// Factory function to initialize the model
var initializeResourceModel = function (sequelize) {
    Resource.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        capacity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 1000,
            },
        },
        type: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        location: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        is_active: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        is_deleted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        deleted_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize: sequelize,
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
    });
    return Resource;
};
exports.initializeResourceModel = initializeResourceModel;
exports.default = Resource;
