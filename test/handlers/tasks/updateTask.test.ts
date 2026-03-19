// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('PUT /api/tasks/:id - updateTask', () => {
  beforeAll(() => {
    console.log('[START] PUT /api/tasks/:id - updateTask');
  });

  afterAll(() => {
    console.log('[END] PUT /api/tasks/:id - updateTask');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクのタイトルが更新できるんやで', async () => {
    const created = await taskStore.create({ title: '織田信長の野望' });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '豊臣秀吉の天下統一' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.title).toEqual('豊臣秀吉の天下統一');
  });

  it('タスクのステータスが更新できるんやで', async () => {
    const created = await taskStore.create({ title: '徳川家康の忍耐' });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.status).toEqual('done');
  });

  it('存在しないIDやったら404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '武田信玄の進軍' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Task not found');
  });

  it('無効なstatusやったら400返すっちゅうねん', async () => {
    const created = await taskStore.create({ title: '上杉謙信の義' });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid_status' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual('Invalid status');
  });

  it('サロゲートペア文字（森鷗外）でタイトル更新できるんやで', async () => {
    const created = await taskStore.create({ title: '伊達政宗の策略' });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '森鷗外の進軍' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.title).toEqual('森鷗外の進軍');
  });
});
