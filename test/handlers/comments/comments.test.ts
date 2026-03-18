// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { commentStore } from '../../../src/store/commentStore';
import { tagStore } from '../../../src/store/tagStore';
import { taskStore } from '../../../src/store/taskStore';
import type { Task } from '../../../src/types/task';

let parentTask: Task;

beforeAll(() => {
  console.log('[START] Comments Handlers');
});

afterAll(() => {
  console.log('[END] Comments Handlers');
});

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  parentTask = await taskStore.create({ title: 'マグロタスク' });
});

describe('GET /api/tasks/:taskId/comments', () => {
  it('タスクに紐づくコメント一覧が取得できるんやで', async () => {
    await commentStore.create(parentTask.id, { content: 'マグロの感想' });
    await commentStore.create(parentTask.id, { content: 'サーモンについて' });

    const res = await app.request(`/api/tasks/${parentTask.id}/comments`);
    expect(res.status).toEqual(200);

    const data = await res.json();
    expect(data.comments.length).toEqual(2);
  });

  it('コメントがないタスクやったら空配列が返るんやで', async () => {
    const res = await app.request(`/api/tasks/${parentTask.id}/comments`);
    expect(res.status).toEqual(200);

    const data = await res.json();
    expect(data.comments).toEqual([]);
  });

  it('タスクが存在せんかったら404返すねん', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await app.request(`/api/tasks/${fakeId}/comments`);
    expect(res.status).toEqual(404);

    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });
});

describe('POST /api/tasks/:taskId/comments', () => {
  it('コメントが正しく作成されるんやで', async () => {
    const res = await app.request(`/api/tasks/${parentTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'マグロの感想' }),
    });
    expect(res.status).toEqual(201);

    const data = await res.json();
    expect(data.comment.content).toEqual('マグロの感想');
    expect(data.comment.taskId).toEqual(parentTask.id);
    expect(data.comment.authorId).toEqual(null);
  });

  it('authorId付きでコメントが作れるんやで', async () => {
    const authorId = '00000000-0000-0000-0000-000000000001';
    const res = await app.request(`/api/tasks/${parentTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'イカについて', authorId }),
    });
    expect(res.status).toEqual(201);

    const data = await res.json();
    expect(data.comment.content).toEqual('イカについて');
    expect(data.comment.authorId).toEqual(authorId);
  });

  it('コメント内容がなかったら400になるっちゅうねん', async () => {
    const res = await app.request(`/api/tasks/${parentTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toEqual(400);

    const data = await res.json();
    expect(data.error).toEqual('Content is required');
  });

  it('空文字のコメントも400になるんやで', async () => {
    const res = await app.request(`/api/tasks/${parentTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });
    expect(res.status).toEqual(400);

    const data = await res.json();
    expect(data.error).toEqual('Content is required');
  });

  it('存在せんタスクにコメントしようとしたら404やねん', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await app.request(`/api/tasks/${fakeId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'エビの感想' }),
    });
    expect(res.status).toEqual(404);

    const data = await res.json();
    expect(data.error).toEqual('Task not found');
  });

  it('サロゲートペア文字を含むコメントが作れるんやで', async () => {
    const res = await app.request(`/api/tasks/${parentTask.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '森鷗外についてのコメント' }),
    });
    expect(res.status).toEqual(201);

    const data = await res.json();
    expect(data.comment.content).toEqual('森鷗外についてのコメント');
  });
});

describe('DELETE /api/tasks/:taskId/comments/:commentId', () => {
  it('コメントが正しく削除されるんやで', async () => {
    const created = await commentStore.create(parentTask.id, {
      content: 'タコの感想',
    });

    const res = await app.request(
      `/api/tasks/${parentTask.id}/comments/${created.id}`,
      { method: 'DELETE' }
    );
    expect(res.status).toEqual(200);

    const data = await res.json();
    expect(data.message).toEqual('Comment deleted');

    const listRes = await app.request(
      `/api/tasks/${parentTask.id}/comments`
    );
    const listData = await listRes.json();
    expect(listData.comments).toEqual([]);
  });

  it('存在せんコメントを削除しようとしたら404やねん', async () => {
    const fakeCommentId = '00000000-0000-0000-0000-000000000000';
    const res = await app.request(
      `/api/tasks/${parentTask.id}/comments/${fakeCommentId}`,
      { method: 'DELETE' }
    );
    expect(res.status).toEqual(404);

    const data = await res.json();
    expect(data.error).toEqual('Comment not found');
  });
});
