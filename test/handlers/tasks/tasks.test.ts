// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { commentStore } from '../../../src/store/commentStore';
import { tagStore } from '../../../src/store/tagStore';
import { taskStore } from '../../../src/store/taskStore';
import { userStore } from '../../../src/store/userStore';
import { projectStore } from '../../../src/store/projectStore';
import { milestoneStore } from '../../../src/store/milestoneStore';

beforeAll(() => {
  console.log('[START] Tasks Handlers');
});

afterAll(() => {
  console.log('[END] Tasks Handlers');
});

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await userStore.reset();
  await projectStore.reset();
  await milestoneStore.reset();
});

describe('POST /api/tasks', () => {
  it('タスクが正しく作成されるんやで', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.task.title).toEqual('織田信長の野望');
    expect(data.task.status).toEqual('todo');
    expect(data.task.description).toEqual('');
  });

  it('説明とステータス付きでもタスク作れるんやで', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '豊臣秀吉の天下統一',
        description: '天下統一への道',
        status: 'in_progress',
      }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.task.title).toEqual('豊臣秀吉の天下統一');
    expect(data.task.description).toEqual('天下統一への道');
    expect(data.task.status).toEqual('in_progress');
  });

  it('タイトルがなかったら400返すねん', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '説明だけやで' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Title is required');
  });

  it('空文字のタイトルでも400になるっちゅうねん', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Title is required');
  });

  it('無効なステータスやったら400返すねん', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '武田信玄の進軍', status: 'invalid_status' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Invalid status');
  });

  it('サロゲートペア文字を含むタイトルでもタスクが作れるんやで', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '森鷗外の読書感想文' }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.task.title).toEqual('森鷗外の読書感想文');
  });
});

describe('GET /api/tasks', () => {
  it('タスク一覧を取得できるんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '豊臣秀吉の天下統一' }),
    });

    const res = await app.request('/api/tasks');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks.length).toEqual(2);
  });

  it('タスクが0件のときは空配列返すんやで', async () => {
    const res = await app.request('/api/tasks');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks).toEqual([]);
  });

  it('ステータスでフィルタできるんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望', status: 'todo' }),
    });
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '豊臣秀吉の天下統一', status: 'done' }),
    });

    const res = await app.request('/api/tasks?status=done');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks.length).toEqual(1);
    expect(data.tasks[0].title).toEqual('豊臣秀吉の天下統一');
  });

  it('存在しないステータスでフィルタしたら空配列返すんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });

    const res = await app.request('/api/tasks?status=cancelled');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks).toEqual([]);
  });
});

describe('GET /api/tasks/:id', () => {
  it('IDでタスク取得できるんやで', async () => {
    const createRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '徳川家康の忍耐' }),
    });
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.task.title).toEqual('徳川家康の忍耐');
  });

  it('存在しないIDやったら404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000');
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('タスクを更新できるんやで', async () => {
    const createRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '武田信玄の進軍' }),
    });
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '武田信玄の進軍（更新済み）',
        status: 'in_progress',
      }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.task.title).toEqual('武田信玄の進軍（更新済み）');
    expect(data.task.status).toEqual('in_progress');
  });

  it('存在しないタスクの更新は404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '上杉謙信の義' }),
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });

  it('無効なステータスで更新したら400になるっちゅうねん', async () => {
    const createRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '上杉謙信の義' }),
    });
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid_status' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Invalid status');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('タスクを削除できるんやで', async () => {
    const createRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '伊達政宗の策略' }),
    });
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.message).toEqual('Task deleted');

    const getRes = await app.request(`/api/tasks/${created.task.id}`);
    expect(getRes.status).toEqual(404);
  });

  it('存在しないタスクの削除は404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });
});

describe('GET /api/tasks/search', () => {
  it('キーワードでタスク検索できるんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '豊臣秀吉の天下統一' }),
    });

    const res = await app.request('/api/tasks/search?q=織田');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks.length).toEqual(1);
    expect(data.tasks[0].title).toEqual('織田信長の野望');
  });

  it('説明文でも検索できるんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '徳川家康の忍耐', description: '関ヶ原の戦い' }),
    });

    const res = await app.request('/api/tasks/search?q=関ヶ原');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks.length).toEqual(1);
    expect(data.tasks[0].title).toEqual('徳川家康の忍耐');
  });

  it('クエリパラメータなしやったら400返すねん', async () => {
    const res = await app.request('/api/tasks/search');
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual("Query parameter 'q' is required");
  });

  it('マッチするタスクがなかったら空配列返すんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });

    const res = await app.request('/api/tasks/search?q=存在しない');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tasks).toEqual([]);
  });
});

describe('GET /api/tasks/stats', () => {
  it('タスクの統計情報を取得できるんやで', async () => {
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望', status: 'todo' }),
    });
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '豊臣秀吉の天下統一', status: 'in_progress' }),
    });
    await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '徳川家康の忍耐', status: 'done' }),
    });

    const res = await app.request('/api/tasks/stats');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.total).toEqual(3);
    expect(data.byStatus).toEqual({
      todo: 1,
      in_progress: 1,
      done: 1,
    });
  });

  it('タスクが0件でも統計取得できるんやで', async () => {
    const res = await app.request('/api/tasks/stats');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.total).toEqual(0);
    expect(data.byStatus).toEqual({
      todo: 0,
      in_progress: 0,
      done: 0,
    });
  });
});

describe('GET /api/tasks/:id/tags', () => {
  it('タスクのタグ一覧を取得できるんやで', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });
    const taskData = await taskRes.json();

    const tagRes = await app.request('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'マグロ' }),
    });
    const tagData = await tagRes.json();

    await app.request(`/api/tasks/${taskData.task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tagData.tag.id }),
    });

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tags.length).toEqual(1);
    expect(data.tags[0].name).toEqual('マグロ');
  });

  it('タグが未設定のタスクは空配列返すんやで', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '豊臣秀吉の天下統一' }),
    });
    const taskData = await taskRes.json();

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tags).toEqual([]);
  });

  it('存在しないタスクのタグ取得は404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags');
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });
});

describe('POST /api/tasks/:id/tags', () => {
  it('タスクにタグを追加できるんやで', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '武田信玄の進軍' }),
    });
    const taskData = await taskRes.json();

    const tagRes = await app.request('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'サーモン' }),
    });
    const tagData = await tagRes.json();

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tagData.tag.id }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.tags.length).toEqual(1);
    expect(data.tags[0].name).toEqual('サーモン');
  });

  it('tagIdがなかったら400返すねん', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '上杉謙信の義' }),
    });
    const taskData = await taskRes.json();

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('tagId is required');
  });

  it('存在しないタスクへのタグ追加は404返すねん', async () => {
    const tagRes = await app.request('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'エビ' }),
    });
    const tagData = await tagRes.json();

    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tagData.tag.id }),
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });

  it('存在しないタグの追加は404返すねん', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '伊達政宗の策略' }),
    });
    const taskData = await taskRes.json();

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: '00000000-0000-0000-0000-000000000000' }),
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Tag not found');
  });
});

describe('DELETE /api/tasks/:id/tags/:tagId', () => {
  it('タスクからタグを削除できるんやで', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '織田信長の野望' }),
    });
    const taskData = await taskRes.json();

    const tagRes = await app.request('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'イカ' }),
    });
    const tagData = await tagRes.json();

    await app.request(`/api/tasks/${taskData.task.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: tagData.tag.id }),
    });

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags/${tagData.tag.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.message).toEqual('Tag removed from task');
  });

  it('存在しないタスクからのタグ削除は404返すねん', async () => {
    const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });

  it('紐づいてないタグの削除は404返すねん', async () => {
    const taskRes = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '徳川家康の忍耐' }),
    });
    const taskData = await taskRes.json();

    const tagRes = await app.request('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'タマゴ' }),
    });
    const tagData = await tagRes.json();

    const res = await app.request(`/api/tasks/${taskData.task.id}/tags/${tagData.tag.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Tag not found on this task');
  });
});
