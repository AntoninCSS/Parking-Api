const request = require('supertest');

describe('Rate Limiter', () => {

  describe('Global limiter', () => {
    let app;

    beforeAll(() => {
      jest.resetModules();
      app = require('../../app');
    });

    it('should return 429 after 100 requests', async () => {
      for (let i = 0; i < 100; i++) {
        await request(app).get('/parkings');
      }
      const res = await request(app).get('/parkings');
      expect(res.status).toBe(429);
      expect(res.body.message).toBe('Trop de requêtes, réessaie plus tard.');
    });
  });

  describe('Auth limiter', () => {
    let app;

    beforeAll(() => {
      jest.resetModules();
      app = require('../../app');
    });

    it('should return 429 after 10 requests on /auth/login', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app).post('/auth/login').send({ email: 'test@test.com', password: 'wrong' });
      }
      const res = await request(app).post('/auth/login').send({ email: 'test@test.com', password: 'wrong' });
      expect(res.status).toBe(429);
      expect(res.body.message).toBe('Trop de tentatives, réessaie dans 15 minutes.');
    });

    it('should return 429 after 10 requests on /auth/register', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app).post('/auth/register').send({ email: 'test@test.com', password: 'wrong' });
      }
      const res = await request(app).post('/auth/register').send({ email: 'test@test.com', password: 'wrong' });
      expect(res.status).toBe(429);
      expect(res.body.message).toBe('Trop de tentatives, réessaie dans 15 minutes.');
    });
  });

});
