// ── Global test environment setup ─────────────────────────────────────────────
// This file runs before every test file.  It seeds the environment variables
// that are validated at module-evaluation time in production code (i.e. before
// any exported function is called).  Without these stubs the modules throw on
// import and no test can even load.

// Cloudinary vars — required by src/config/cloudinary.ts
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
