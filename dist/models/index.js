"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabaseConnection = exports.checkDatabaseHealth = exports.syncModels = exports.withTransaction = exports.getModels = exports.getSequelizeInstance = exports.defineAssociations = exports.initializeModels = exports.BookingException = exports.Booking = exports.Resource = void 0;
var database_1 = require("../config/database");
// Import models and their factory functions
var Resource_1 = require("./Resource");
exports.Resource = Resource_1.default;
var Booking_1 = require("./Booking");
exports.Booking = Booking_1.default;
var BookingException_1 = require("./BookingException");
exports.BookingException = BookingException_1.default;
// Define associations
var defineAssociations = function () {
    // Resource associations
    Resource_1.default.hasMany(Booking_1.default, {
        foreignKey: 'resource_id',
        as: 'bookings',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    // Booking associations
    Booking_1.default.belongsTo(Resource_1.default, {
        foreignKey: 'resource_id',
        as: 'resource',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    Booking_1.default.hasMany(BookingException_1.default, {
        foreignKey: 'booking_id',
        as: 'exceptions',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    // Self-referential association for recurring bookings
    Booking_1.default.belongsTo(Booking_1.default, {
        foreignKey: 'recurrence_parent_id',
        as: 'parent',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    Booking_1.default.hasMany(Booking_1.default, {
        foreignKey: 'recurrence_parent_id',
        as: 'children',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    // BookingException associations
    BookingException_1.default.belongsTo(Booking_1.default, {
        foreignKey: 'booking_id',
        as: 'booking',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
};
exports.defineAssociations = defineAssociations;
// Initialize all models and associations
var initializeModels = function () { return __awaiter(void 0, void 0, void 0, function () {
    var sequelize, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                sequelize = (0, database_1.getSequelize)();
                // Initialize all models with the Sequelize instance
                (0, Resource_1.initializeResourceModel)(sequelize);
                (0, Booking_1.initializeBookingModel)(sequelize);
                (0, BookingException_1.initializeBookingExceptionModel)(sequelize);
                // Define associations
                defineAssociations();
                if (!(process.env.NODE_ENV === 'development')) return [3 /*break*/, 2];
                return [4 /*yield*/, sequelize.sync({ alter: true })];
            case 1:
                _a.sent();
                console.log('✅ All models synchronized successfully');
                _a.label = 2;
            case 2:
                console.log('✅ Models initialized with associations');
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('❌ Error initializing models:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.initializeModels = initializeModels;
// Lazy Sequelize instance - only get when needed
var getSequelizeInstance = function () { return (0, database_1.getSequelize)(); };
exports.getSequelizeInstance = getSequelizeInstance;
// Helper function to get all models
var getModels = function () { return ({
    Resource: Resource_1.default,
    Booking: Booking_1.default,
    BookingException: BookingException_1.default,
}); };
exports.getModels = getModels;
// Database transaction helper
var withTransaction = function (callback) { return __awaiter(void 0, void 0, void 0, function () {
    var sequelize;
    return __generator(this, function (_a) {
        sequelize = (0, exports.getSequelizeInstance)();
        return [2 /*return*/, sequelize.transaction(callback)];
    });
}); };
exports.withTransaction = withTransaction;
// Model synchronization for testing
var syncModels = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (options) {
        var sequelize, error_2;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sequelize = (0, exports.getSequelizeInstance)();
                    return [4 /*yield*/, sequelize.sync(options)];
                case 1:
                    _a.sent();
                    console.log("\u2705 Models synchronized with options:", options);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('❌ Error synchronizing models:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
};
exports.syncModels = syncModels;
// Database health check
var checkDatabaseHealth = function () { return __awaiter(void 0, void 0, void 0, function () {
    var sequelize, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sequelize = (0, exports.getSequelizeInstance)();
                return [4 /*yield*/, sequelize.authenticate()];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
            case 2:
                error_3 = _a.sent();
                console.error('Database health check failed:', error_3);
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.checkDatabaseHealth = checkDatabaseHealth;
// Close database connection
var closeDatabaseConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
    var sequelize, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sequelize = (0, exports.getSequelizeInstance)();
                return [4 /*yield*/, sequelize.close()];
            case 1:
                _a.sent();
                console.log('✅ Database connection closed');
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('❌ Error closing database connection:', error_4);
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.closeDatabaseConnection = closeDatabaseConnection;
