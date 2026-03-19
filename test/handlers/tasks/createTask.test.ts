// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('POST /api/tasks - createTask', () => {
  beforeAll(() => {
    console.log('[START] POST /api/tasks - createTask');
  });

  afterAll(() => {
    console.log('[END] POST /api/tasks - createTask');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タスクが正しく作成されるんやで', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual('織田信長の野望');
    expect(body.task.status).toEqual('todo');
    expect(body.task.id).toBeDefined();
  });

  it('全フィールド指定してタスク作成できるんやで', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '豊臣秀吉の天下統一',
        description: '天下を統一するという壮大な計画',
        status: 'in_progress',
      }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual('豊臣秀吉の天下統一');
    expect(body.task.description).toEqual('天下を統一するという壮大な計画');
    expect(body.task.status).toEqual('in_progress');
  });

  it('titleが空やったら400返すっちゅうねん', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual('Title is required');
  });

  it('無効なstatusやったら400返すねん', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '伊達政宗の策略', status: 'invalid_status' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual('Invalid status');
  });

  it('サロゲートペア文字（森鷗外）を含むタスクも作成できるんやで', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '森鷗外の野望' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual('森鷗外の野望');
  });

  it('空文字のtitleやったら400返すっちゅうねん', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual('Title is required');
  });
});
