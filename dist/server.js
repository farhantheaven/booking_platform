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
exports.startServer = startServer;
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var config_1 = require("./config");
var database_1 = require("./config/database");
var routes_1 = require("./routes");
// Custom error handling middleware
var errorHandler = function (error, req, res, next) {
    console.error('Unhandled error:', error);
    res.status(500).json(__assign({ success: false, error: 'Internal server error' }, (config_1.serverConfig.nodeEnv === 'development' && {
        details: error.message,
        stack: error.stack
    })));
};
// 404 handler
var notFoundHandler = function (req, res) {
    res.status(404).json({
        success: false,
        error: "Route ".concat(req.method, " ").concat(req.path, " not found"),
        availableEndpoints: [
            'GET /health',
            'GET /api-docs',
            'POST /bookings',
            'GET /bookings/:id',
            'DELETE /bookings/:id',
            'GET /availability',
            'GET /resources/:id/summary'
        ]
    });
};
// Request logging middleware
var requestLogger = function (req, res, next) {
    var start = Date.now();
    res.on('finish', function () {
        var duration = Date.now() - start;
        console.log("".concat(req.method, " ").concat(req.path, " ").concat(res.statusCode, " - ").concat(duration, "ms"));
    });
    next();
};
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var db_1, isHealthy, initializeModels, app, server_1, error_1;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    // Initialize database connection
                    console.log('Initializing database connection...');
                    db_1 = (0, database_1.initializeDatabase)(config_1.databaseConfig);
                    return [4 /*yield*/, db_1.isHealthy()];
                case 1:
                    isHealthy = _b.sent();
                    if (!isHealthy) {
                        throw new Error('Database connection failed');
                    }
                    console.log('Database connected successfully');
                    // Initialize Sequelize models
                    console.log('Initializing Sequelize models...');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./models'); })];
                case 2:
                    initializeModels = (_b.sent()).initializeModels;
                    return [4 /*yield*/, initializeModels()];
                case 3:
                    _b.sent();
                    console.log('Models initialized successfully');
                    app = (0, express_1.default)();
                    // Security middleware
                    app.use((0, helmet_1.default)({
                        contentSecurityPolicy: {
                            directives: {
                                defaultSrc: ["'self'"],
                                styleSrc: ["'self'", "'unsafe-inline'"],
                                scriptSrc: ["'self'"],
                                imgSrc: ["'self'", "data:", "https:"],
                            },
                        },
                    }));
                    // CORS configuration
                    app.use((0, cors_1.default)({
                        origin: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000'],
                        credentials: true,
                        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
                    }));
                    // Body parsing middleware
                    app.use(express_1.default.json({ limit: '10mb' }));
                    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
                    // Request logging
                    if (config_1.serverConfig.nodeEnv !== 'test') {
                        app.use(requestLogger);
                    }
                    // API routes
                    app.use('/api/v1', (0, routes_1.createRoutes)(db_1));
                    // Root endpoint
                    app.get('/', function (req, res) {
                        res.json({
                            service: 'HighLevel Booking Platform',
                            version: '1.0.0',
                            status: 'healthy',
                            timestamp: new Date().toISOString(),
                            documentation: '/api/v1/api-docs',
                            endpoints: {
                                health: '/api/v1/health',
                                bookings: '/api/v1/bookings',
                                availability: '/api/v1/availability'
                            }
                        });
                    });
                    // 404 handler
                    app.use(notFoundHandler);
                    // Error handling middleware (must be last)
                    app.use(errorHandler);
                    server_1 = app.listen(config_1.serverConfig.port, function () {
                        console.log("\n\uD83D\uDE80 HighLevel Booking Platform started successfully!\n\n\uD83D\uDCCB Server Information:\n   \u2022 Port: ".concat(config_1.serverConfig.port, "\n   \u2022 Environment: ").concat(config_1.serverConfig.nodeEnv, "\n   \u2022 Database: ").concat(config_1.databaseConfig.host, ":").concat(config_1.databaseConfig.port, "/").concat(config_1.databaseConfig.database, "\n\n\uD83D\uDCDA API Documentation: http://localhost:").concat(config_1.serverConfig.port, "/api/v1/api-docs\n\uD83C\uDFE5 Health Check: http://localhost:").concat(config_1.serverConfig.port, "/api/v1/health\n\n\uD83D\uDD17 Available Endpoints:\n   \u2022 POST   /api/v1/bookings - Create booking\n   \u2022 GET    /api/v1/bookings/:id - Get booking\n   \u2022 DELETE /api/v1/bookings/:id - Cancel booking\n   \u2022 GET    /api/v1/availability - Check availability\n   \u2022 GET    /api/v1/resources/:id/summary - Get utilization summary\n\n\uD83D\uDCCA Load Testing:\n   \u2022 npm run load-test - Simulate normal load\n   \u2022 npm run spike-test - Simulate traffic spikes\n      "));
                    });
                    // Graceful shutdown
                    process.on('SIGTERM', function () { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            console.log('Received SIGTERM, shutting down gracefully...');
                            server_1.close(function () { return __awaiter(_this, void 0, void 0, function () {
                                var error_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.log('HTTP server closed');
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, db_1.close()];
                                        case 2:
                                            _a.sent();
                                            console.log('Database connection closed');
                                            process.exit(0);
                                            return [3 /*break*/, 4];
                                        case 3:
                                            error_2 = _a.sent();
                                            console.error('Error closing database:', error_2);
                                            process.exit(1);
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [2 /*return*/];
                        });
                    }); });
                    process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            console.log('Received SIGINT, shutting down gracefully...');
                            server_1.close(function () { return __awaiter(_this, void 0, void 0, function () {
                                var error_3;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.log('HTTP server closed');
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, db_1.close()];
                                        case 2:
                                            _a.sent();
                                            console.log('Database connection closed');
                                            process.exit(0);
                                            return [3 /*break*/, 4];
                                        case 3:
                                            error_3 = _a.sent();
                                            console.error('Error closing database:', error_3);
                                            process.exit(1);
                                            return [3 /*break*/, 4];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [2 /*return*/];
                        });
                    }); });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error('Failed to start server:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Start the server
if (require.main === module) {
    startServer().catch(function (error) {
        console.error('Fatal error during startup:', error);
        process.exit(1);
    });
}
