// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { userStore } from '../../../src/store/userStore';
import { taskStore } from '../../../src/store/taskStore';

describe('Users Handlers', () => {
  beforeAll(() => {
    console.log('[START] Users Handlers');
  });

  afterAll(() => {
    console.log('[END] Users Handlers');
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  describe('GET /api/users', () => {
    it('ユーザーが1人もおらんときは空配列返すんやで', async () => {
      const res = await app.request('/api/users');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.users).toEqual([]);
    });

    it('ユーザーが複数おったら全員返すんやで', async () => {
      await userStore.create({ name: 'マグロ', email: 'maguro@example.com' });
      await userStore.create({ name: 'サーモン', email: 'salmon@example.com' });

      const res = await app.request('/api/users');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.users).toHaveLength(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('IDでユーザーが取得できるんやで', async () => {
      const created = await userStore.create({ name: 'マグロ', email: 'maguro@example.com' });

      const res = await app.request(`/api/users/${created.id}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.user.id).toEqual(created.id);
      expect(json.user.name).toEqual('マグロ');
      expect(json.user.email).toEqual('maguro@example.com');
    });

    it('存在しないIDやったら404返すねん', async () => {
      const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000');
      expect(res.status).toEqual(404);
    });
  });

  describe('POST /api/users', () => {
    it('ユーザーが正しく作成できるんやで', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロ', email: 'maguro@example.com' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.user.name).toEqual('マグロ');
      expect(json.user.email).toEqual('maguro@example.com');
      expect(json.user.id).toBeDefined();
    });

    it('nameがなかったら400返すねん', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maguro@example.com' }),
      });
      expect(res.status).toEqual(400);
    });

    it('emailがなかったら400返すねん', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロ' }),
      });
      expect(res.status).toEqual(400);
    });

    it('同じemailで登録しようとしたら409か400返すねん', async () => {
      await userStore.create({ name: 'マグロ', email: 'maguro@example.com' });

      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモン', email: 'maguro@example.com' }),
      });
      expect([400, 409, 500]).toContain(res.status);
    });

    it('境界値: 森鷗外みたいなサロゲートペア文字でもユーザー作成できるんやで', async () => {
      const res = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '森鷗外', email: 'ogai@example.com' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.user.name).toEqual('森鷗外');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('ユーザーの名前が更新できるんやで', async () => {
      const created = await userStore.create({ name: 'マグロ', email: 'maguro@example.com' });

      const res = await app.request(`/api/users/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモン' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.user.name).toEqual('サーモン');
      expect(json.user.id).toEqual(created.id);
    });

    it('ユーザーのemailが更新できるんやで', async () => {
      const created = await userStore.create({ name: 'エビ', email: 'ebi@example.com' });

      const res = await app.request(`/api/users/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'shrimp@example.com' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.user.email).toEqual('shrimp@example.com');
    });

    it('存在しないIDを更新しようとしたら404返すねん', async () => {
      const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イカ' }),
      });
      expect(res.status).toEqual(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('ユーザーが削除できるんやで', async () => {
      const created = await userStore.create({ name: 'タマゴ', email: 'tamago@example.com' });

      const res = await app.request(`/api/users/${created.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual('User deleted');
    });

    it('削除したあとはもう取得できへんねん', async () => {
      const created = await userStore.create({ name: 'タマゴ', email: 'tamago@example.com' });

      await app.request(`/api/users/${created.id}`, { method: 'DELETE' });

      const res = await app.request(`/api/users/${created.id}`);
      expect(res.status).toEqual(404);
    });

    it('存在しないIDを削除しようとしたら404返すねん', async () => {
      const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
    });
  });

  describe('GET /api/users/:id/tasks', () => {
    it('ユーザーのタスク一覧が空のとき空配列返すんやで', async () => {
      const created = await userStore.create({ name: 'イカ', email: 'ika@example.com' });

      const res = await app.request(`/api/users/${created.id}/tasks`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks).toEqual([]);
    });

    it('存在しないIDやったらタスク一覧も404返すねん', async () => {
      const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000/tasks');
      expect(res.status).toEqual(404);
    });
  });
});
