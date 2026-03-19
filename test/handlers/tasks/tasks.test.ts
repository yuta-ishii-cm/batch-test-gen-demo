// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('Tasks Handlers', () => {
  beforeAll(() => {
    console.log('[START] Tasks Handlers');
  });

  afterAll(() => {
    console.log('[END] Tasks Handlers');
  });

  beforeEach(async () => {
    await taskStore.reset();
    await tagStore.reset();
  });

  describe('GET /api/tasks', () => {
    it('タスクが1件もない時に空の配列を返すんやで', async () => {
      const res = await app.request('/api/tasks');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks).toEqual([]);
    });

    it('タスクを作成したら一覧に含まれるんやで', async () => {
      const task = await taskStore.create({ title: '織田信長の野望' });

      const res = await app.request('/api/tasks');
      expect(res.status).toEqual(200);
      const json = await res.json();
      const found = json.tasks.find((t: { id: string }) => t.id === task.id);
      expect(found).toBeDefined();
      expect(found.title).toEqual('織田信長の野望');
    });

    it('statusフィルタでtodoだけ絞り込めるんやで', async () => {
      const todoTask = await taskStore.create({ title: '織田信長の野望', status: 'todo' });
      const doneTask = await taskStore.create({ title: '豊臣秀吉の天下統一', status: 'done' });

      const res = await app.request('/api/tasks?status=todo');
      expect(res.status).toEqual(200);
      const json = await res.json();
      const foundTodo = json.tasks.find((t: { id: string }) => t.id === todoTask.id);
      const foundDone = json.tasks.find((t: { id: string }) => t.id === doneTask.id);
      expect(foundTodo).toBeDefined();
      expect(foundDone).toBeUndefined();
    });

    it('statusフィルタでin_progressだけ絞り込めるんやで', async () => {
      const inProgressTask = await taskStore.create({ title: '徳川家康の忍耐', status: 'in_progress' });
      const todoTask = await taskStore.create({ title: '武田信玄の進軍', status: 'todo' });

      const res = await app.request('/api/tasks?status=in_progress');
      expect(res.status).toEqual(200);
      const json = await res.json();
      const foundInProgress = json.tasks.find((t: { id: string }) => t.id === inProgressTask.id);
      const foundTodo = json.tasks.find((t: { id: string }) => t.id === todoTask.id);
      expect(foundInProgress).toBeDefined();
      expect(foundTodo).toBeUndefined();
    });

    it('存在しないstatusフィルタやったら空配列が返るんやで', async () => {
      await taskStore.create({ title: '上杉謙信の義', status: 'todo' });

      const res = await app.request('/api/tasks?status=invalid_status');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks).toEqual([]);
    });
  });

  describe('GET /api/tasks/search', () => {
    it('キーワードでタスクのタイトルを検索できるんやで', async () => {
      const uniqueSuffix = `_${Date.now()}_oda`;
      const task = await taskStore.create({ title: `織田信長の野望${uniqueSuffix}` });
      await taskStore.create({ title: `豊臣秀吉の天下統一${uniqueSuffix}` });

      const res = await app.request(`/api/tasks/search?q=${encodeURIComponent(`織田信長の野望${uniqueSuffix}`)}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks.length).toEqual(1);
      expect(json.tasks[0].id).toEqual(task.id);
    });

    it('descriptionの中もキーワードで検索できるんやで', async () => {
      const uniqueKeyword = `奥州の覇者_${Date.now()}`;
      const task = await taskStore.create({ title: '伊達政宗の策略', description: uniqueKeyword });
      await taskStore.create({ title: '上杉謙信の義' });

      const res = await app.request(`/api/tasks/search?q=${encodeURIComponent(uniqueKeyword)}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks.length).toEqual(1);
      expect(json.tasks[0].id).toEqual(task.id);
    });

    it('マッチするタスクがなかったら空配列を返すんやで', async () => {
      const uniqueNoMatch = `存在しないキーワード_${Date.now()}`;
      const res = await app.request(`/api/tasks/search?q=${encodeURIComponent(uniqueNoMatch)}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks).toEqual([]);
    });

    it('qパラメータなしやったら400エラーになるんやで', async () => {
      const res = await app.request('/api/tasks/search');
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual("Query parameter 'q' is required");
    });

    it('境界値: サロゲートペア文字「森鷗外」を含むタイトルでも検索できるんやで', async () => {
      const uniqueTitle = `森鷗外の作品_${Date.now()}`;
      const task = await taskStore.create({ title: uniqueTitle, description: '文豪の世界' });

      const res = await app.request(`/api/tasks/search?q=${encodeURIComponent(uniqueTitle)}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks.length).toEqual(1);
      expect(json.tasks[0].id).toEqual(task.id);
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('タスクが0件の時に統計情報を返すんやで', async () => {
      const res = await app.request('/api/tasks/stats');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.total).toEqual(0);
      expect(json.byStatus).toEqual({ todo: 0, in_progress: 0, done: 0 });
    });

    it('各ステータスのタスク数が統計に反映されるんやで', async () => {
      const statsBefore = await (await app.request('/api/tasks/stats')).json();

      await taskStore.create({ title: '織田信長の野望', status: 'todo' });
      await taskStore.create({ title: '豊臣秀吉の天下統一', status: 'todo' });
      await taskStore.create({ title: '徳川家康の忍耐', status: 'in_progress' });
      await taskStore.create({ title: '武田信玄の進軍', status: 'done' });

      const statsAfter = await (await app.request('/api/tasks/stats')).json();

      expect(statsAfter.total).toEqual(statsBefore.total + 4);
      expect(statsAfter.byStatus.todo).toEqual(statsBefore.byStatus.todo + 2);
      expect(statsAfter.byStatus.in_progress).toEqual(statsBefore.byStatus.in_progress + 1);
      expect(statsAfter.byStatus.done).toEqual(statsBefore.byStatus.done + 1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('IDを指定してタスクを取得できるんやで', async () => {
      const task = await taskStore.create({ title: '上杉謙信の義' });

      const res = await app.request(`/api/tasks/${task.id}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.task.id).toEqual(task.id);
      expect(json.task.title).toEqual('上杉謙信の義');
    });

    it('存在しないIDやったら404返すんやで', async () => {
      const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000');
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Task not found');
    });

    it('作成したタスクのフィールドが全部揃っとるんやで', async () => {
      const task = await taskStore.create({
        title: '伊達政宗の策略',
        description: '奥州の覇者',
        status: 'in_progress',
      });

      const res = await app.request(`/api/tasks/${task.id}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.task.title).toEqual('伊達政宗の策略');
      expect(json.task.description).toEqual('奥州の覇者');
      expect(json.task.status).toEqual('in_progress');
    });
  });

  describe('POST /api/tasks', () => {
    it('タイトルだけ指定してタスクを作成できるんやで', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '織田信長の野望' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.task.title).toEqual('織田信長の野望');
      expect(json.task.status).toEqual('todo');
      expect(json.task.id).toBeDefined();
    });

    it('全フィールド指定してタスクを作成できるんやで', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '豊臣秀吉の天下統一',
          description: '全国統一を目指す',
          status: 'in_progress',
        }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.task.title).toEqual('豊臣秀吉の天下統一');
      expect(json.task.description).toEqual('全国統一を目指す');
      expect(json.task.status).toEqual('in_progress');
    });

    it('titleなしで400エラーになるっちゅうねん', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'タイトルなし' }),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Title is required');
    });

    it('不正なstatusで400エラーになるっちゅうねん', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '徳川家康の忍耐', status: 'invalid' }),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Invalid status');
    });

    it('境界値：タイトルが空文字やったら400エラーになるんやで', async () => {
      const res = await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Title is required');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('タスクのstatusを更新できるんやで', async () => {
      const task = await taskStore.create({ title: '武田信玄の進軍' });

      const res = await app.request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.task.id).toEqual(task.id);
      expect(json.task.status).toEqual('in_progress');
    });

    it('タイトルとdescriptionも更新できるんやで', async () => {
      const task = await taskStore.create({ title: '上杉謙信の義' });

      const res = await app.request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '上杉謙信の義と仁', description: '越後の龍' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.task.title).toEqual('上杉謙信の義と仁');
      expect(json.task.description).toEqual('越後の龍');
    });

    it('存在しないIDやったら404返すんやで', async () => {
      const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Task not found');
    });

    it('不正なstatusで400エラーになるんやで', async () => {
      const task = await taskStore.create({ title: '伊達政宗の策略' });

      const res = await app.request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'running' }),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Invalid status');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('タスクを削除できるんやで', async () => {
      const task = await taskStore.create({ title: '織田信長の野望' });

      const res = await app.request(`/api/tasks/${task.id}`, { method: 'DELETE' });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual('Task deleted');
    });

    it('削除したタスクはもう取得できへんんやで', async () => {
      const task = await taskStore.create({ title: '豊臣秀吉の天下統一' });

      await app.request(`/api/tasks/${task.id}`, { method: 'DELETE' });

      const res = await app.request(`/api/tasks/${task.id}`);
      expect(res.status).toEqual(404);
    });

    it('存在しないIDやったら404返すんやで', async () => {
      const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Task not found');
    });
  });

  describe('GET /api/tasks/:id/tags', () => {
    it('タスクに紐づくタグ一覧を取得できるんやで', async () => {
      const task = await taskStore.create({ title: '徳川家康の忍耐' });

      const res = await app.request(`/api/tasks/${task.id}/tags`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tags).toEqual([]);
    });

    it('存在しないタスクIDやったら404返すんやで', async () => {
      const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags');
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Task not found');
    });
  });

  describe('POST /api/tasks/:id/tags', () => {
    it('タスクにタグを追加できるんやで', async () => {
      const task = await taskStore.create({ title: '武田信玄の進軍' });
      const tag = await tagStore.create({ name: 'マグロ' });

      const res = await app.request(`/api/tasks/${task.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.tags.length).toEqual(1);
      expect(json.tags[0].id).toEqual(tag.id);
      expect(json.tags[0].name).toEqual('マグロ');
    });

    it('存在しないタスクにタグを追加しようとしたら404やで', async () => {
      const tag = await tagStore.create({ name: 'サーモン' });

      const res = await app.request('/api/tasks/00000000-0000-0000-0000-000000000000/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Task not found');
    });

    it('存在しないタグをタスクに追加しようとしたら404やで', async () => {
      const task = await taskStore.create({ title: '上杉謙信の義' });

      const res = await app.request(`/api/tasks/${task.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: '00000000-0000-0000-0000-000000000000' }),
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Tag not found');
    });

    it('tagIdなしやったら400エラーになるんやで', async () => {
      const task = await taskStore.create({ title: '伊達政宗の策略' });

      const res = await app.request(`/api/tasks/${task.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('tagId is required');
    });
  });

  describe('DELETE /api/tasks/:id/tags/:tagId', () => {
    it('タスクからタグを削除できるんやで', async () => {
      const task = await taskStore.create({ title: '織田信長の野望' });
      const tag = await tagStore.create({ name: 'エビ' });
      await tagStore.addToTask(task.id, tag.id);

      const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual('Tag removed from task');
    });

    it('削除後はタグ一覧に表示されへんくなるんやで', async () => {
      const task = await taskStore.create({ title: '豊臣秀吉の天下統一' });
      const tag = await tagStore.create({ name: 'イカ' });
      await tagStore.addToTask(task.id, tag.id);

      await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, { method: 'DELETE' });

      const res = await app.request(`/api/tasks/${task.id}/tags`);
      const json = await res.json();
      expect(json.tags).toEqual([]);
    });

    it('タスクに紐づいてないタグを削除しようとしたら404やで', async () => {
      const task = await taskStore.create({ title: '徳川家康の忍耐' });
      const tag = await tagStore.create({ name: 'タマゴ' });

      const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Tag not found on this task');
    });

    it('存在しないタスクIDやったら404返すんやで', async () => {
      const tag = await tagStore.create({ name: 'ウニ' });

      const res = await app.request(`/api/tasks/00000000-0000-0000-0000-000000000000/tags/${tag.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Task not found');
    });
  });
});
