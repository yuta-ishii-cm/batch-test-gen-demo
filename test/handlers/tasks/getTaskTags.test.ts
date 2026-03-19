// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('GET /api/tasks/:id/tags - getTaskTags', () => {
  beforeAll(() => {
    console.log('[START] GET /api/tasks/:id/tags - getTaskTags');
  });

  afterAll(() => {
    console.log('[END] GET /api/tasks/:id/tags - getTaskTags');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクのタグ一覧が取得できるんやで', async () => {
    const task = await taskStore.create({ title: '織田信長の野望' });
    const tag = await tagStore.create({ name: '重要' });
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(1);
    expect(body.tags[0].name).toEqual('重要');
  });

  it('タグがないタスクは空配列返すんやで', async () => {
    const task = await taskStore.create({ title: '徳川家康の忍耐' });

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags).toEqual([]);
  });

  it('存在しないタスクIDやったら404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags');
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Task not found');
  });

  it('複数タグが紐づいてても全部取得できるっちゅうねん', async () => {
    const task = await taskStore.create({ title: '武田信玄の進軍' });
    const tag1 = await tagStore.create({ name: '緊急' });
    const tag2 = await tagStore.create({ name: '重要' });
    await tagStore.addToTask(task.id, tag1.id);
    await tagStore.addToTask(task.id, tag2.id);

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(2);
  });
});
