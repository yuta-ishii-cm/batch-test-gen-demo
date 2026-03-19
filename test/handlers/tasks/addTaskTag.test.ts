// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('POST /api/tasks/:id/tags - addTaskTag', () => {
  beforeAll(() => {
    console.log('[START] POST /api/tasks/:id/tags - addTaskTag');
  });

  afterAll(() => {
    console.log('[END] POST /api/tasks/:id/tags - addTaskTag');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクにタグを追加できるんやで', async () => {
    const task = await taskStore.create({ title: '織田信長の野望' });
    const tag = await tagStore.create({ name: '重要' });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tag.id }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tags.length).toEqual(1);
    expect(body.tags[0].name).toEqual('重要');
  });

  it('tagIdがないとき400返すっちゅうねん', async () => {
    const task = await taskStore.create({ title: '豊臣秀吉の天下統一' });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual('tagId is required');
  });

  it('存在しないタスクIDやったら404返すねん', async () => {
    const tag = await tagStore.create({ name: '緊急' });

    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tag.id }),
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Task not found');
  });

  it('存在しないタグIDやったら404返すねん', async () => {
    const task = await taskStore.create({ title: '徳川家康の忍耐' });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: '00000000-0000-0000-0000-000000000000' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Tag not found');
  });
});
