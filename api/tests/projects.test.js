const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock Project model
const mockSave = jest.fn();
const mockProjectConstructor = jest.fn().mockImplementation((data) => {
  return {
    ...data,
    save: mockSave
  };
});

// We need to mock the model BEFORE requiring the router
jest.mock('../models/Project', () => {
  return mockProjectConstructor;
});

// Mock mongoose
jest.mock('mongoose', () => {
  return {
    connect: jest.fn().mockResolvedValue('Connected'),
    Schema: jest.fn(),
    model: jest.fn(),
  };
});

describe('Projects API', () => {
  let app;
  let projectsRouter;
  // Store original env
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
    projectsRouter = require('../routes/projects');
    app.use('/api/projects', projectsRouter);
  };

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      process.env.MONGODB_URI = 'mongodb://fake-uri';
      setupApp();

      const projectData = {
        stage: 'ingestion',
        dataSource: {
            type: 'manual',
            rawData: 'test data'
        }
      };

      mockSave.mockResolvedValueOnce({
        _id: 'new-project-id',
        ...projectData
      });

      const res = await request(app)
        .post('/api/projects')
        .send(projectData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // The route returns the project object which is what we mocked + save method
      // We expect the response to contain the data fields
      expect(res.body.data.stage).toBe(projectData.stage);
      expect(res.body.message).toBe('Project created successfully');

      expect(mockProjectConstructor).toHaveBeenCalledWith(expect.objectContaining(projectData));
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return 503 if MongoDB is not configured', async () => {
      delete process.env.MONGODB_URI;
      setupApp();

      const res = await request(app)
        .post('/api/projects')
        .send({});

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('MongoDB not configured');
    });

    it('should return 500 if save fails', async () => {
      process.env.MONGODB_URI = 'mongodb://fake-uri';
      setupApp();

      const projectData = { stage: 'ingestion' };
      const errorMessage = 'Database error';

      mockSave.mockRejectedValueOnce(new Error(errorMessage));

      const res = await request(app)
        .post('/api/projects')
        .send(projectData);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(errorMessage);
    });
  });
});
