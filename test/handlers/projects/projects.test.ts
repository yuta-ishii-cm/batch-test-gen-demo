// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { projectStore } from '../../../src/store/projectStore';
import { taskStore } from '../../../src/store/taskStore';

describe('Projects API', () => {
  beforeAll(() => {
    console.log('[START] Projects API');
  });

  afterAll(() => {
    console.log('[END] Projects API');
  });

  beforeEach(async () => {
    await taskStore.reset();
    await projectStore.reset();
  });

  describe('GET /api/projects - getProjects', () => {
    describe('正常系', () => {
      it('プロジェクト一覧が空のとき空配列を返すんやで', async () => {
        const res = await app.request('/api/projects');
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.projects).toEqual([]);
      });

      it('プロジェクトが複数あったら全部返すねん', async () => {
        await projectStore.create({ name: 'マグロプロジェクト' });
        await projectStore.create({ name: 'サーモン計画' });

        const res = await app.request('/api/projects');
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.projects.length).toEqual(2);
      });

      it('statusクエリでフィルタできるんやで', async () => {
        await projectStore.create({ name: 'マグロプロジェクト' });
        const archived = await projectStore.create({ name: 'エビ計画' });
        await projectStore.update(archived.id, { status: 'archived' });

        const res = await app.request('/api/projects?status=archived');
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.projects.length).toEqual(1);
        expect(body.projects[0].name).toEqual('エビ計画');
        expect(body.projects[0].status).toEqual('archived');
      });

      it('statusフィルタに一致するもんがなかったら空配列やで', async () => {
        await projectStore.create({ name: 'マグロプロジェクト' });

        const res = await app.request('/api/projects?status=completed');
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.projects).toEqual([]);
      });
    });

    describe('境界値', () => {
      it('サロゲートペア文字（森鷗外）を含むプロジェクト名で取得できるんやで', async () => {
        await projectStore.create({ name: '森鷗外プロジェクト' });

        const res = await app.request('/api/projects');
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.projects.length).toEqual(1);
        expect(body.projects[0].name).toEqual('森鷗外プロジェクト');
      });
    });
  });

  describe('GET /api/projects/:id - getProjectById', () => {
    describe('正常系', () => {
      it('IDを指定したらプロジェクトが返ってくるんやで', async () => {
        const created = await projectStore.create({ name: 'イカプロジェクト', description: 'イカの詳細' });

        const res = await app.request(`/api/projects/${created.id}`);
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.id).toEqual(created.id);
        expect(body.project.name).toEqual('イカプロジェクト');
        expect(body.project.description).toEqual('イカの詳細');
        expect(body.project.status).toEqual('active');
      });
    });

    describe('異常系', () => {
      it('存在しないIDやったら404返すねん', async () => {
        const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000');
        const body = await res.json();

        expect(res.status).toEqual(404);
        expect(body.error).toEqual('Project not found');
      });
    });

    describe('境界値', () => {
      it('サロゲートペア文字（森鷗外）を含むプロジェクトもIDで取得できるで', async () => {
        const created = await projectStore.create({ name: '森鷗外プロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`);
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.name).toEqual('森鷗外プロジェクト');
      });
    });
  });

  describe('POST /api/projects - createProject', () => {
    describe('正常系', () => {
      it('名前だけでプロジェクトが作成されるんやで', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'タマゴプロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(201);
        expect(body.project.name).toEqual('タマゴプロジェクト');
        expect(body.project.status).toEqual('active');
        expect(body.project.id).toBeDefined();
        expect(body.project.createdAt).toBeDefined();
        expect(body.project.updatedAt).toBeDefined();
      });

      it('名前と説明付きでプロジェクトが作成できるんやで', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'ウニプロジェクト', description: 'ウニの高級プロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(201);
        expect(body.project.name).toEqual('ウニプロジェクト');
        expect(body.project.description).toEqual('ウニの高級プロジェクト');
      });
    });

    describe('異常系', () => {
      it('名前なしやったら400エラーになるねん', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: '名前がない' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(400);
        expect(body.error).toEqual('Name is required');
      });

      it('空オブジェクトでも400エラーやで', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const body = await res.json();

        expect(res.status).toEqual(400);
        expect(body.error).toEqual('Name is required');
      });
    });

    describe('境界値', () => {
      it('空文字の名前やったら400エラーになるんやで', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(400);
        expect(body.error).toEqual('Name is required');
      });

      it('サロゲートペア文字（森鷗外）を含む名前でも作成できるで', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '森鷗外プロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(201);
        expect(body.project.name).toEqual('森鷗外プロジェクト');
      });

      it('descriptionなしやったらデフォルト値が入るんやで', async () => {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'イクラプロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(201);
        expect(body.project.description).toEqual('');
      });
    });
  });

  describe('PUT /api/projects/:id - updateProject', () => {
    describe('正常系', () => {
      it('プロジェクト名を更新できるんやで', async () => {
        const created = await projectStore.create({ name: 'アナゴプロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'ホタテプロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.name).toEqual('ホタテプロジェクト');
      });

      it('ステータスを更新できるで', async () => {
        const created = await projectStore.create({ name: 'カンパチ計画' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.status).toEqual('completed');
      });

      it('説明文を更新できるんやで', async () => {
        const created = await projectStore.create({ name: 'マグロプロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: '大トロの説明' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.description).toEqual('大トロの説明');
      });

      it('複数フィールド同時に更新できるで', async () => {
        const created = await projectStore.create({ name: 'エビプロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'エビ改', status: 'archived', description: '改修済み' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.name).toEqual('エビ改');
        expect(body.project.status).toEqual('archived');
        expect(body.project.description).toEqual('改修済み');
      });
    });

    describe('異常系', () => {
      it('存在しないIDやったら404返すねん', async () => {
        const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '幻のプロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(404);
        expect(body.error).toEqual('Project not found');
      });

      it('無効なステータスやったら400エラーになるで', async () => {
        const created = await projectStore.create({ name: 'サーモンプロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'invalid_status' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(400);
        expect(body.error).toEqual('Invalid status');
      });
    });

    describe('境界値', () => {
      it('サロゲートペア文字（森鷗外）を含む名前に更新できるんやで', async () => {
        const created = await projectStore.create({ name: 'タマゴプロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '森鷗外プロジェクト' }),
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.project.name).toEqual('森鷗外プロジェクト');
      });

      it('全ステータス値（active/archived/completed）に更新できるで', async () => {
        const created = await projectStore.create({ name: 'ウニプロジェクト' });

        for (const status of ['active', 'archived', 'completed'] as const) {
          const res = await app.request(`/api/projects/${created.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          const body = await res.json();

          expect(res.status).toEqual(200);
          expect(body.project.status).toEqual(status);
        }
      });
    });
  });

  describe('DELETE /api/projects/:id - deleteProject', () => {
    describe('正常系', () => {
      it('プロジェクトを削除できるんやで', async () => {
        const created = await projectStore.create({ name: 'イクラプロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'DELETE',
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.message).toEqual('Project deleted');

        const check = await projectStore.getById(created.id);
        expect(check).toBeNull();
      });

      it('削除後にGETしたら404になるんやで', async () => {
        const created = await projectStore.create({ name: 'ホタテプロジェクト' });
        await app.request(`/api/projects/${created.id}`, { method: 'DELETE' });

        const res = await app.request(`/api/projects/${created.id}`);
        const body = await res.json();

        expect(res.status).toEqual(404);
        expect(body.error).toEqual('Project not found');
      });
    });

    describe('異常系', () => {
      it('存在しないIDやったら404返すねん', async () => {
        const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000', {
          method: 'DELETE',
        });
        const body = await res.json();

        expect(res.status).toEqual(404);
        expect(body.error).toEqual('Project not found');
      });
    });

    describe('境界値', () => {
      it('サロゲートペア文字（森鷗外）を含むプロジェクトも削除できるで', async () => {
        const created = await projectStore.create({ name: '森鷗外プロジェクト' });

        const res = await app.request(`/api/projects/${created.id}`, {
          method: 'DELETE',
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.message).toEqual('Project deleted');
      });
    });
  });

  describe('GET /api/projects/:id/tasks - getProjectTasks', () => {
    describe('正常系', () => {
      it('プロジェクトに紐づくタスク一覧を返すんやで', async () => {
        const project = await projectStore.create({ name: 'マグロプロジェクト' });
        await taskStore.create({ title: 'マグロタスク1', projectId: project.id });
        await taskStore.create({ title: 'マグロタスク2', projectId: project.id });

        const res = await app.request(`/api/projects/${project.id}/tasks`);
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.tasks.length).toEqual(2);
      });

      it('タスクがないプロジェクトやったら空配列返すで', async () => {
        const project = await projectStore.create({ name: 'サーモン計画' });

        const res = await app.request(`/api/projects/${project.id}/tasks`);
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.tasks).toEqual([]);
      });

      it('他のプロジェクトのタスクは含まれへんで', async () => {
        const project1 = await projectStore.create({ name: 'エビプロジェクト' });
        const project2 = await projectStore.create({ name: 'イカプロジェクト' });
        await taskStore.create({ title: 'エビタスク', projectId: project1.id });
        await taskStore.create({ title: 'イカタスク', projectId: project2.id });

        const res = await app.request(`/api/projects/${project1.id}/tasks`);
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.tasks.length).toEqual(1);
        expect(body.tasks[0].title).toEqual('エビタスク');
      });
    });

    describe('異常系', () => {
      it('存在しないプロジェクトIDやったら404返すねん', async () => {
        const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000/tasks');
        const body = await res.json();

        expect(res.status).toEqual(404);
        expect(body.error).toEqual('Project not found');
      });
    });

    describe('境界値', () => {
      it('サロゲートペア文字（森鷗外）を含むタスクも取得できるで', async () => {
        const project = await projectStore.create({ name: 'タマゴプロジェクト' });
        await taskStore.create({ title: '森鷗外タスク', projectId: project.id });

        const res = await app.request(`/api/projects/${project.id}/tasks`);
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.tasks.length).toEqual(1);
        expect(body.tasks[0].title).toEqual('森鷗外タスク');
      });
    });
  });
});
