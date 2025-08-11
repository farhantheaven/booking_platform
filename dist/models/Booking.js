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
exports.initializeBookingModel = void 0;
var sequelize_1 = require("sequelize");
// Define the Sequelize model class
var Booking = /** @class */ (function (_super) {
    __extends(Booking, _super);
    function Booking() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Instance methods
    Booking.prototype.isOverlapping = function (otherStart, otherEnd) {
        return this.start_time < otherEnd && this.end_time > otherStart;
    };
    Booking.prototype.getDurationMinutes = function () {
        return Math.floor((this.end_time.getTime() - this.start_time.getTime()) / (1000 * 60));
    };
    Booking.prototype.isInBusinessHours = function () {
        var startHour = this.start_time.getHours();
        var endHour = this.end_time.getHours();
        var dayOfWeek = this.start_time.getDay();
        // Business hours: 9 AM to 5 PM, Monday to Friday
        var isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        var startsAfter9AM = startHour >= 9;
        var endsBefore5PM = endHour <= 17;
        return isWeekday && startsAfter9AM && endsBefore5PM;
    };
    return Booking;
}(sequelize_1.Model));
// Factory function to initialize the model
var initializeBookingModel = function (sequelize) {
    var _a, _b;
    Booking.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        resource_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'resources',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        title: {
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
        start_time: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: true,
            },
        },
        end_time: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: true,
            },
        },
        is_recurring: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        recurrence_rule: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
            validate: {
                isValidRRule: function (value) {
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
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'bookings',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        series_id: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
        },
        original_start_time: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        created_by: {
            type: sequelize_1.DataTypes.STRING(255),
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
        tableName: 'bookings',
        modelName: 'Booking',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        validate: {
            timeRangeValid: function () {
                if (this.start_time >= this.end_time) {
                    throw new Error('Start time must be before end time');
                }
            },
            recurrenceConsistent: function () {
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
                    series_id: (_a = {},
                        _a[sequelize_1.Op.ne] = null,
                        _a),
                },
            },
            {
                name: 'idx_bookings_parent',
                fields: ['recurrence_parent_id'],
                where: {
                    recurrence_parent_id: (_b = {},
                        _b[sequelize_1.Op.ne] = null,
                        _b),
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
    });
    return Booking;
};
exports.initializeBookingModel = initializeBookingModel;
exports.default = Booking;
