"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSequelize = exports.initializeDatabase = exports.getDatabase = exports.DatabaseConnection = void 0;
var sequelize_1 = require("sequelize");
var DatabaseConnection = /** @class */ (function () {
    function DatabaseConnection(config) {
        this.config = config;
        var sequelizeOptions = {
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            password: config.password,
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 20,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
            dialectOptions: {
                connectTimeout: 2000,
            },
            define: {
                underscored: true,
                freezeTableName: true,
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
            },
        };
        this.sequelize = new sequelize_1.Sequelize(sequelizeOptions);
        // Handle connection errors
        this.sequelize.addHook('afterConnect', function () {
            console.log('Connected to PostgreSQL database via Sequelize');
        });
    }
    DatabaseConnection.prototype.getSequelize = function () {
        return this.sequelize;
    };
    DatabaseConnection.prototype.authenticate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sequelize.authenticate()];
                    case 1:
                        _a.sent();
                        console.log('Database connection established successfully.');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Unable to connect to the database:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseConnection.prototype.sync = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var error_2;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sequelize.sync(options)];
                    case 1:
                        _a.sent();
                        console.log('Database synchronized successfully.');
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error synchronizing database:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseConnection.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sequelize.close()];
                    case 1:
                        _a.sent();
                        console.log('Database connection closed.');
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error closing database connection:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Transaction helper
    DatabaseConnection.prototype.transaction = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sequelize.transaction(callback)];
            });
        });
    };
    // Health check
    DatabaseConnection.prototype.isHealthy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sequelize.authenticate()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Database health check failed:', error_4);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Raw query method (for backward compatibility)
    DatabaseConnection.prototype.query = function (sql_1) {
        return __awaiter(this, arguments, void 0, function (sql, options) {
            var results, error_5;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sequelize.query(sql, __assign({ type: sequelize_1.QueryTypes.SELECT }, options))];
                    case 1:
                        results = (_a.sent())[0];
                        return [2 /*return*/, { rows: results, rowCount: results.length }];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Query error:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseConnection;
}());
exports.DatabaseConnection = DatabaseConnection;
// Singleton instance
var dbInstance = null;
var getDatabase = function (config) {
    if (!dbInstance && config) {
        dbInstance = new DatabaseConnection(config);
    }
    if (!dbInstance) {
        throw new Error('Database not initialized. Please provide configuration.');
    }
    return dbInstance;
};
exports.getDatabase = getDatabase;
var initializeDatabase = function (config) {
    dbInstance = new DatabaseConnection(config);
    return dbInstance;
};
exports.initializeDatabase = initializeDatabase;
var getSequelize = function () {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return dbInstance.getSequelize();
};
exports.getSequelize = getSequelize;
