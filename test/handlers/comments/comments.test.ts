// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { commentStore } from '../../../src/store/commentStore';
import { taskStore } from '../../../src/store/taskStore';

describe('Comments Handlers', () => {
  beforeAll(() => {
    console.log('[START] Comments Handlers');
  });

  afterAll(() => {
    console.log('[END] Comments Handlers');
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
  });

  const createTask = async (title = '織田信長の野望') => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    return json.task;
  };

  describe('GET /api/tasks/:taskId/comments', () => {
    it('コメントが1件もない時に空の配列が返ってくるんやで', async () => {
      const task = await createTask();
      const res = await app.request(`/api/tasks/${task.id}/comments`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.comments).toEqual([]);
    });

    it('作成したコメントが一覧で取得できるんやで', async () => {
      const task = await createTask();
      await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'マグロが美味しいわ' }),
      });
      const res = await app.request(`/api/tasks/${task.id}/comments`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.comments).toHaveLength(1);
      expect(json.comments[0].content).toEqual('マグロが美味しいわ');
    });

    it('複数コメントが全部取得できるんやで', async () => {
      const task = await createTask('豊臣秀吉の天下統一');
      await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'マグロが美味しいわ' }),
      });
      await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'サーモンも好きやで' }),
      });
      const res = await app.request(`/api/tasks/${task.id}/comments`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.comments).toHaveLength(2);
    });

    it('存在しないtaskIdで取得したら404返すねん', async () => {
      const res = await app.request(
        '/api/tasks/00000000-0000-0000-0000-000000000000/comments'
      );
      expect(res.status).toEqual(404);
    });
  });

  describe('POST /api/tasks/:taskId/comments', () => {
    it('コメントが正しく作成できるんやで', async () => {
      const task = await createTask();
      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'サーモンも好きやで' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.comment.content).toEqual('サーモンも好きやで');
      expect(json.comment.taskId).toEqual(task.id);
    });

    it('contentなしやったら400返すねん', async () => {
      const task = await createTask();
      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);
    });

    it('存在しないtaskIdにコメントしたら404返すねん', async () => {
      const res = await app.request(
        '/api/tasks/00000000-0000-0000-0000-000000000000/comments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'エビが好きやねん' }),
        }
      );
      expect(res.status).toEqual(404);
    });

    it('境界値: サロゲートペア文字「森鷗外」を含むコメントが作成できるんやで', async () => {
      const task = await createTask();
      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '森鷗外の作品について' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.comment.content).toEqual('森鷗外の作品について');
    });
  });

  describe('DELETE /api/tasks/:taskId/comments/:id', () => {
    it('コメントが正しく削除できるんやで', async () => {
      const task = await createTask();
      const createRes = await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'エビが好きやねん' }),
      });
      const created = await createRes.json();
      const deleteRes = await app.request(
        `/api/tasks/${task.id}/comments/${created.comment.id}`,
        { method: 'DELETE' }
      );
      expect(deleteRes.status).toEqual(200);
    });

    it('削除したあとは一覧に出てけえへんねん', async () => {
      const task = await createTask('徳川家康の江戸幕府');
      const createRes = await app.request(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'イカも美味しいわ' }),
      });
      const created = await createRes.json();
      await app.request(
        `/api/tasks/${task.id}/comments/${created.comment.id}`,
        { method: 'DELETE' }
      );
      const listRes = await app.request(`/api/tasks/${task.id}/comments`);
      const listJson = await listRes.json();
      expect(listJson.comments).toEqual([]);
    });

    it('存在しないIDのコメント削除したら404返すねん', async () => {
      const task = await createTask();
      const res = await app.request(
        `/api/tasks/${task.id}/comments/00000000-0000-0000-0000-000000000000`,
        { method: 'DELETE' }
      );
      expect(res.status).toEqual(404);
    });
  });
});
