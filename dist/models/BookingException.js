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
exports.initializeBookingExceptionModel = void 0;
var sequelize_1 = require("sequelize");
// Define the Sequelize model class
var BookingException = /** @class */ (function (_super) {
    __extends(BookingException, _super);
    function BookingException() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Instance methods
    BookingException.prototype.isCancelled = function () {
        return this.exception_type === 'cancelled';
    };
    BookingException.prototype.isModified = function () {
        return this.exception_type === 'modified';
    };
    BookingException.prototype.hasTimeChange = function () {
        return this.isModified() && (this.new_start_time !== undefined || this.new_end_time !== undefined);
    };
    BookingException.prototype.hasContentChange = function () {
        return this.isModified() && (this.new_title !== undefined || this.new_description !== undefined);
    };
    return BookingException;
}(sequelize_1.Model));
// Factory function to initialize the model
var initializeBookingExceptionModel = function (sequelize) {
    BookingException.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        booking_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        exception_date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: true,
            },
        },
        exception_type: {
            type: sequelize_1.DataTypes.ENUM('cancelled', 'modified'),
            allowNull: false,
            validate: {
                isIn: [['cancelled', 'modified']],
            },
        },
        new_start_time: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            validate: {
                isValidForModified: function (value) {
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
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            validate: {
                isValidForModified: function (value) {
                    if (this.exception_type === 'modified' && !value) {
                        throw new Error('Modified exceptions must have new end time');
                    }
                    if (this.exception_type === 'cancelled' && value) {
                        throw new Error('Cancelled exceptions should not have new start time');
                    }
                },
                isAfterStartTime: function (value) {
                    if (value && this.new_start_time && value <= this.new_start_time) {
                        throw new Error('New end time must be after new start time');
                    }
                },
            },
        },
        new_title: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
            validate: {
                len: [1, 255],
            },
        },
        new_description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize: sequelize,
        tableName: 'booking_exceptions',
        modelName: 'BookingException',
        timestamps: false, // Only created_at, no updated_at for exceptions
        underscored: true,
        validate: {
            modifiedExceptionValid: function () {
                if (this.exception_type === 'modified') {
                    if (!this.new_start_time || !this.new_end_time) {
                        throw new Error('Modified exceptions must have new start and end times');
                    }
                    if (this.new_start_time >= this.new_end_time) {
                        throw new Error('New start time must be before new end time');
                    }
                }
            },
            cancelledExceptionValid: function () {
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
    });
    return BookingException;
};
exports.initializeBookingExceptionModel = initializeBookingExceptionModel;
exports.default = BookingException;
