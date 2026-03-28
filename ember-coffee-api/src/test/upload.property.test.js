// Feature: ember-coffee-co, Property 27: File upload accepts JPEG/PNG and rejects all other types
// Feature: ember-coffee-co, Property 29: File upload enforces 5 MB size limit
// Validates: Requirements 12.1, 12.2, 12.4, 12.5

import { jest } from '@jest/globals';

// Mock cloudinary so no real network calls are made.
jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    config: jest.fn(),
  },
}));

// Mock multer-storage-cloudinary: replace CloudinaryStorage with a factory
// that returns a multer-compatible in-memory storage engine.
// This lets the real fileFilter and limits logic run unchanged.
jest.unstable_mockModule('multer-storage-cloudinary', () => ({
  CloudinaryStorage: jest.fn().mockImplementation(() => ({
    // multer storage interface: _handleFile stores the file in memory
    _handleFile(req, file, cb) {
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        cb(null, {
          path: 'https://res.cloudinary.com/test/image/upload/test.jpg',
          size: buffer.length,
        });
      });
      file.stream.on('error', cb);
    },
    _removeFile(req, file, cb) {
      cb(null);
    },
  })),
}));

const { default: fc } = await import('fast-check');
const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: upload } = await import('../middleware/uploadMiddleware.js');

// ---------------------------------------------------------------------------
// Minimal Express app that applies the upload middleware and returns 200 on
// success, or forwards multer errors as 400.
// ---------------------------------------------------------------------------
function buildApp() {
  const app = express();

  app.post('/upload', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      res.status(200).json({ message: 'ok' });
    });
  });

  return app;
}

const app = buildApp();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MB = 1024 * 1024;
const FIVE_MB = 5 * MB;

/** Build a minimal fake file buffer of the given byte length. */
function makeBuffer(bytes) {
  return Buffer.alloc(bytes, 0x42); // fill with 'B'
}

// ---------------------------------------------------------------------------
// Property 27: File upload accepts JPEG/PNG and rejects all other types
// Validates: Requirements 12.1, 12.2
// ---------------------------------------------------------------------------
describe('Property 27: MIME type filtering', () => {
  const ALLOWED_MIMES = ['image/jpeg', 'image/png'];

  // A fixed set of MIME types that are NOT jpeg or png
  const REJECTED_MIMES = [
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/octet-stream',
    'video/mp4',
    'audio/mpeg',
  ];

  test('allowed MIME types (image/jpeg, image/png) are accepted with HTTP 200', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALLOWED_MIMES),
        async (mimeType) => {
          const res = await request(app)
            .post('/upload')
            .attach('image', makeBuffer(1024), {
              filename: 'test.jpg',
              contentType: mimeType,
            });

          expect(res.status).toBe(200);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('disallowed MIME types are rejected with HTTP 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REJECTED_MIMES),
        async (mimeType) => {
          const res = await request(app)
            .post('/upload')
            .attach('image', makeBuffer(1024), {
              filename: 'test.bin',
              contentType: mimeType,
            });

          expect(res.status).toBe(400);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 29: File upload enforces 5 MB size limit
// Validates: Requirements 12.4, 12.5
// ---------------------------------------------------------------------------
describe('Property 29: File size limit enforcement', () => {
  test('files below 5 MB are accepted with HTTP 200', async () => {
    await fc.assert(
      fc.asyncProperty(
        // multer's fileSize limit is exclusive: files strictly less than 5 MB pass.
        // A file of exactly 5 MB (5242880 bytes) is rejected by multer (LIMIT_FILE_SIZE).
        fc.integer({ min: 1, max: FIVE_MB - 1 }),
        async (fileSize) => {
          const res = await request(app)
            .post('/upload')
            .attach('image', makeBuffer(fileSize), {
              filename: 'test.jpg',
              contentType: 'image/jpeg',
            });

          expect(res.status).toBe(200);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('files at or exceeding 5 MB are rejected with HTTP 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        // multer rejects files at exactly 5 MB and above (limit is exclusive).
        fc.integer({ min: FIVE_MB, max: 10 * MB }),
        async (fileSize) => {
          const res = await request(app)
            .post('/upload')
            .attach('image', makeBuffer(fileSize), {
              filename: 'test.jpg',
              contentType: 'image/jpeg',
            });

          expect(res.status).toBe(400);
        },
      ),
      { numRuns: 100 },
    );
  });
});
