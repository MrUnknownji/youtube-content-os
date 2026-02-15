const request = require('supertest');
const express = require('express');

// Mock Cloudinary
const mockConfig = jest.fn();
const mockUpload = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: mockConfig,
    uploader: {
      upload: mockUpload,
      destroy: jest.fn(),
    },
  },
}));

describe('Assets API (Cloudinary Vulnerability)', () => {
  let app;
  let assetsRouter;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const setupApp = () => {
    const express = require('express');
    app = express();
    app.use(express.json());
    assetsRouter = require('../routes/assets');
    app.use('/api/upload', assetsRouter);
  };

  it('should IGNORE Cloudinary credentials from headers (SECURITY FIX)', async () => {
    setupApp();

    // Ensure env vars are not set so we rely on headers
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const headers = {
      'x-cloudinary-cloud-name': 'header-cloud',
      'x-cloudinary-api-key': 'header-key',
      'x-cloudinary-api-secret': 'header-secret',
    };

    mockUpload.mockResolvedValue({
      public_id: 'test-id',
      secure_url: 'http://test-url.com',
      width: 100,
      height: 100,
      bytes: 1234,
    });

    const res = await request(app)
      .post('/api/upload')
      .set(headers)
      .send({
        image: 'data:image/png;base64,test',
        filename: 'test.png',
      });

    // Should fallback to base64 because no config provided (headers ignored)
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fallbackUsed).toBe(true);
    expect(res.body.message).toContain('Cloudinary not configured');

    // Verify cloudinary.config was NOT called
    expect(mockConfig).not.toHaveBeenCalled();
  });

  it('should use Cloudinary credentials from body', async () => {
    setupApp();

    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const cloudinaryConfig = {
      cloudName: 'body-cloud',
      apiKey: 'body-key',
      apiSecret: 'body-secret',
    };

    mockUpload.mockResolvedValue({
      public_id: 'test-id',
      secure_url: 'http://test-url.com',
      width: 100,
      height: 100,
      bytes: 1234,
    });

    const res = await request(app)
      .post('/api/upload')
      .send({
        image: 'data:image/png;base64,test',
        filename: 'test.png',
        cloudinaryConfig,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fallbackUsed).toBe(false);
    expect(res.body.message).toBe('Image uploaded to Cloudinary');

    // Verify cloudinary.config was called with body values
    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: 'body-cloud',
      api_key: 'body-key',
      api_secret: 'body-secret',
    });
  });
});
