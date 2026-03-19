// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('DELETE /api/tasks/:id - deleteTask', () => {
  beforeAll(() => {
    console.log('[START] DELETE /api/tasks/:id - deleteTask');
  });

  afterAll(() => {
    console.log('[END] DELETE /api/tasks/:id - deleteTask');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクが正しく削除されるんやで', async () => {
    const created = await taskStore.create({ title: '織田信長の野望' });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: 'DELETE',
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual('Task deleted');
  });

  it('削除したタスクはもう取得できへんねん', async () => {
    const created = await taskStore.create({ title: '豊臣秀吉の天下統一' });

    await app.request(`/api/tasks/${created.id}`, { method: 'DELETE' });

    const res = await app.request(`/api/tasks/${created.id}`);
    expect(res.status).toEqual(404);
  });

  it('存在しないIDやったら404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Task not found');
  });
});
