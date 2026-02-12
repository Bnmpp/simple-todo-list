const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const TEST_TODOS_FILE = path.join(__dirname, '../todos.test.json');

describe('Todo API Endpoints', () => {

  beforeEach(() => {
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.unlinkSync(TEST_TODOS_FILE);
    }

    const defaultTodosFile = path.join(__dirname, '../todos.json');
    if (fs.existsSync(defaultTodosFile)) {
      fs.writeFileSync(defaultTodosFile, JSON.stringify([]));
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.unlinkSync(TEST_TODOS_FILE);
    }
  });

  // ========================
  // GET
  // ========================
  describe('GET /api/todos', () => {

    test('should return an empty array initially', async () => {
      const response = await request(app).get('/api/todos');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all todos', async () => {
      await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });

      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('text', 'Test todo');
    });

  });

  // ========================
  // POST
  // ========================
  describe('POST /api/todos', () => {

    test('should create a new todo', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 'Buy groceries' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('text', 'Buy groceries');
      expect(response.body).toHaveProperty('completed', false);
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should trim whitespace', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '  Spaced  ' });

      expect(response.status).toBe(201);
      expect(response.body.text).toBe('Spaced');
    });

    test('should return 400 if text missing', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

  });

  // ========================
  // PUT (Toggle)
  // ========================
  describe('PUT /api/todos/:id', () => {

    test('should toggle completion', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });

      const id = create.body.id;

      const response = await request(app)
        .put(`/api/todos/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    test('should return 404 if not found', async () => {
      const response = await request(app)
        .put('/api/todos/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

  });

  // ========================
  // PATCH (Edit) ⭐ NEW
  // ========================
  describe('PATCH /api/todos/:id', () => {

    test('should update todo text', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'Old text' });

      const id = create.body.id;

      const patch = await request(app)
        .patch(`/api/todos/${id}`)
        .send({ text: 'New text' });

      expect(patch.status).toBe(200);
      expect(patch.body.text).toBe('New text');

      const get = await request(app).get('/api/todos');
      expect(get.body[0].text).toBe('New text');
    });

    test('should return 400 if text empty', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'Some text' });

      const id = create.body.id;

      const patch = await request(app)
        .patch(`/api/todos/${id}`)
        .send({ text: '' });

      expect(patch.status).toBe(400);
      expect(patch.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should return 404 if todo not found', async () => {
      const patch = await request(app)
        .patch('/api/todos/999999')
        .send({ text: 'Does not matter' });

      expect(patch.status).toBe(404);
      expect(patch.body).toHaveProperty('error', 'Todo not found');
    });

  });

  // ========================
  // DELETE
  // ========================
  describe('DELETE /api/todos/:id', () => {

    test('should delete todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'Delete me' });

      const id = create.body.id;

      const del = await request(app)
        .delete(`/api/todos/${id}`);

      expect(del.status).toBe(200);

      const get = await request(app).get('/api/todos');
      expect(get.body).toHaveLength(0);
    });

    test('should return 404 if not found', async () => {
      const response = await request(app)
        .delete('/api/todos/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

  });

});
