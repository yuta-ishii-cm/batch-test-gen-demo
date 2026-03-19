// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('GET /api/tasks/:id - getTaskById', () => {
  beforeAll(() => {
    console.log('[START] GET /api/tasks/:id - getTaskById');
  });

  afterAll(() => {
    console.log('[END] GET /api/tasks/:id - getTaskById');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('IDを指定してタスクが取得できるんやで', async () => {
    const created = await taskStore.create({ title: '武田信玄の進軍' });

    const res = await app.request(`/api/tasks/${created.id}`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.id).toEqual(created.id);
    expect(body.task.title).toEqual('武田信玄の進軍');
  });

  it('存在しないIDやったら404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000');
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual('Task not found');
  });

  it('タスクの全フィールドがちゃんと返ってくるんやで', async () => {
    const created = await taskStore.create({
      title: '上杉謙信の義',
      description: '義を重んじる武将',
      status: 'in_progress',
    });

    const res = await app.request(`/api/tasks/${created.id}`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.title).toEqual('上杉謙信の義');
    expect(body.task.description).toEqual('義を重んじる武将');
    expect(body.task.status).toEqual('in_progress');
    expect(body.task.createdAt).toBeDefined();
    expect(body.task.updatedAt).toBeDefined();
  });

  it('サロゲートペア文字（森鷗外）を含むタスクもIDで取得できるっちゅうねん', async () => {
    const created = await taskStore.create({ title: '森鷗外の策略' });

    const res = await app.request(`/api/tasks/${created.id}`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.title).toEqual('森鷗外の策略');
  });
});
