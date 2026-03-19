// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('DELETE /api/tasks/:id/tags/:tagId - removeTaskTag', () => {
  beforeAll(() => {
    console.log('[START] DELETE /api/tasks/:id/tags/:tagId - removeTaskTag');
  });

  afterAll(() => {
    console.log('[END] DELETE /api/tasks/:id/tags/:tagId - removeTaskTag');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクからタグを削除できるんやで', async () => {
    const task = await taskStore.create({ title: '織田信長の野望' });
    const tag = await tagStore.create({ name: '重要' });
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: 'DELETE',
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual('Tag removed from task');
  });

  it('存在しないタスクIDやったら404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags/00000000-0000-0000-0000-000000000001', {
      method: 'DELETE',
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Task not found');
  });

  it('タスクに紐づいてないタグIDやったら404返すっちゅうねん', async () => {
    const task = await taskStore.create({ title: '上杉謙信の義' });
    const tag = await tagStore.create({ name: '緊急' });

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: 'DELETE',
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Tag not found on this task');
  });

  it('タグ削除後にタグ一覧から消えてるんやで', async () => {
    const task = await taskStore.create({ title: '伊達政宗の策略' });
    const tag = await tagStore.create({ name: '重要' });
    await tagStore.addToTask(task.id, tag.id);

    await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, { method: 'DELETE' });

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags).toEqual([]);
  });
});
