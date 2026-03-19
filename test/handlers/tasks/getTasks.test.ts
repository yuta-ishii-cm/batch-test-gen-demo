// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('GET /api/tasks - getTasks', () => {
  beforeAll(() => {
    console.log('[START] GET /api/tasks - getTasks');
  });

  afterAll(() => {
    console.log('[END] GET /api/tasks - getTasks');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクが空のときは空配列を返すんやで', async () => {
    const res = await app.request('/api/tasks');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks).toEqual([]);
  });

  it('全タスクが取得できるんやで', async () => {
    await taskStore.create({ title: '織田信長の野望' });
    await taskStore.create({ title: '豊臣秀吉の天下統一' });

    const res = await app.request('/api/tasks');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(2);
  });

  it('statusクエリでフィルタできるんやで', async () => {
    await taskStore.create({ title: '織田信長の野望', status: 'todo' });
    await taskStore.create({ title: '豊臣秀吉の天下統一', status: 'done' });
    await taskStore.create({ title: '徳川家康の忍耐', status: 'todo' });

    const res = await app.request('/api/tasks?status=todo');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(2);
    expect(body.tasks.every((t: { status: string }) => t.status === 'todo')).toEqual(true);
  });

  it('存在しないstatusでフィルタしたら空配列返すねん', async () => {
    await taskStore.create({ title: '織田信長の野望', status: 'todo' });

    const res = await app.request('/api/tasks?status=in_progress');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks).toEqual([]);
  });

  it('サロゲートペア文字（森鷗外）を含むタスクも取得できるっちゅうねん', async () => {
    await taskStore.create({ title: '森鷗外の進軍' });

    const res = await app.request('/api/tasks');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual('森鷗外の進軍');
  });
});
