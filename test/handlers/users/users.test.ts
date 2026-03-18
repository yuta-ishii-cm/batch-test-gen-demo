// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { commentStore } from '../../../src/store/commentStore';
import { tagStore } from '../../../src/store/tagStore';
import { taskStore } from '../../../src/store/taskStore';
import { userStore } from '../../../src/store/userStore';

beforeAll(() => {
  console.log('[START] Users Handlers');
});

afterAll(() => {
  console.log('[END] Users Handlers');
});

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await userStore.reset();
});

describe('GET /api/users', () => {
  it('ユーザー一覧が空のときは空配列を返すんやで', async () => {
    const res = await app.request('/api/users');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.users).toEqual([]);
  });

  it('複数のユーザーが取得できるんやで', async () => {
    await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'マグロ', email: 'maguro@example.com' }),
    });
    await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'サーモン', email: 'salmon@example.com' }),
    });

    const res = await app.request('/api/users');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.users.length).toEqual(2);
  });
});

describe('POST /api/users', () => {
  it('ユーザーが正しく作成されるんやで', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'エビ', email: 'ebi@example.com' }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.user.name).toEqual('エビ');
    expect(data.user.email).toEqual('ebi@example.com');
    expect(data.user.id).toBeDefined();
    expect(data.user.createdAt).toBeDefined();
    expect(data.user.updatedAt).toBeDefined();
  });

  it('名前がなかったら400になるっちゅうねん', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'noname@example.com' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Name is required');
  });

  it('メールがなかったら400になるっちゅうねん', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'イカ' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Email is required');
  });

  it('名前が空文字やったら400になるんやで', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'empty@example.com' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Name is required');
  });

  it('メールが空文字やったら400になるんやで', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'タマゴ', email: '' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Email is required');
  });

  it('サロゲートペア文字を含む名前でもユーザーが作れるんやで', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '森鷗外', email: 'ogai@example.com' }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.user.name).toEqual('森鷗外');
  });
});

describe('GET /api/users/:id', () => {
  it('IDを指定してユーザーが取得できるんやで', async () => {
    const createRes = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ウニ', email: 'uni@example.com' }),
    });
    const created = await createRes.json();
    const userId = created.user.id;

    const res = await app.request(`/api/users/${userId}`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.user.id).toEqual(userId);
    expect(data.user.name).toEqual('ウニ');
    expect(data.user.email).toEqual('uni@example.com');
  });

  it('存在しないIDやったら404返すねん', async () => {
    const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('User not found');
  });
});

describe('PUT /api/users/:id', () => {
  it('ユーザーの名前を更新できるんやで', async () => {
    const createRes = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'イクラ', email: 'ikura@example.com' }),
    });
    const created = await createRes.json();
    const userId = created.user.id;

    const res = await app.request(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'アナゴ' }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.user.name).toEqual('アナゴ');
    expect(data.user.email).toEqual('ikura@example.com');
  });

  it('ユーザーのメールを更新できるんやで', async () => {
    const createRes = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ホタテ', email: 'hotate@example.com' }),
    });
    const created = await createRes.json();
    const userId = created.user.id;

    const res = await app.request(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hotate-new@example.com' }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.user.name).toEqual('ホタテ');
    expect(data.user.email).toEqual('hotate-new@example.com');
  });

  it('存在しないユーザーを更新しようとしたら404返すねん', async () => {
    const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'カンパチ' }),
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('User not found');
  });
});

describe('DELETE /api/users/:id', () => {
  it('ユーザーが削除できるんやで', async () => {
    const createRes = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'カンパチ', email: 'kanpachi@example.com' }),
    });
    const created = await createRes.json();
    const userId = created.user.id;

    const res = await app.request(`/api/users/${userId}`, { method: 'DELETE' });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.message).toEqual('User deleted');

    const getRes = await app.request(`/api/users/${userId}`);
    expect(getRes.status).toEqual(404);
  });

  it('存在しないユーザーを削除しようとしたら404返すねん', async () => {
    const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('User not found');
  });
});

describe('GET /api/users/:id/tasks', () => {
  it('ユーザーに紐づくタスクが取得できるんやで', async () => {
    const userRes = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'マグロ', email: 'maguro@example.com' }),
    });
    const user = (await userRes.json()).user;

    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'タスク1', assigneeId: user.id }),
    });
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'タスク2', assigneeId: user.id }),
    });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks.length).toEqual(2);
  });

  it('タスクがないユーザーやったら空配列を返すんやで', async () => {
    const userRes = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'サーモン', email: 'salmon@example.com' }),
    });
    const user = (await userRes.json()).user;

    const res = await app.request(`/api/users/${user.id}/tasks`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks).toEqual([]);
  });

  it('存在しないユーザーのタスクを取得しようとしたら404返すねん', async () => {
    const res = await app.request('/api/users/00000000-0000-0000-0000-000000000000/tasks');
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('User not found');
  });
});
