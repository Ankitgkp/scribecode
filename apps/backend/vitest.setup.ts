// Test-only environment defaults. These are applied before any application module
// (and therefore the validated env config) is imported.
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.PORT ??= "4000";
process.env.APP_VERSION ??= "0.1.0";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/scribecode_test?schema=public";
