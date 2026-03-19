// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { projectStore } from '../../../src/store/projectStore';
import { taskStore } from '../../../src/store/taskStore';

describe('Projects Handlers', () => {
  beforeAll(() => {
    console.log('[START] Projects Handlers');
  });

  afterAll(() => {
    console.log('[END] Projects Handlers');
  });

  beforeEach(async () => {
    await taskStore.reset();
    await projectStore.reset();
  });

  describe('GET /api/projects', () => {
    it('プロジェクト一覧が空やったらそのまま返すんやで', async () => {
      const res = await app.request('/api/projects');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.projects).toEqual([]);
    });

    it('プロジェクト一覧が取得できるんやで', async () => {
      const res1 = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロプロジェクト' }),
      });
      const res2 = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモンプロジェクト' }),
      });
      expect(res1.status).toEqual(201);
      expect(res2.status).toEqual(201);

      const res = await app.request('/api/projects');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.projects).toHaveLength(2);
    });

    it('activeフィルタで絞り込めるんやで', async () => {
      await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'エビプロジェクト' }),
      });
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イカプロジェクト' }),
      });
      const { project } = await created.json();

      await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      const res = await app.request('/api/projects?status=active');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.projects).toHaveLength(1);
      expect(json.projects[0].status).toEqual('active');
    });

    it('archivedフィルタで絞り込めるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'タマゴプロジェクト' }),
      });
      const { project } = await created.json();

      await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      const res = await app.request('/api/projects?status=archived');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.projects).toHaveLength(1);
      expect(json.projects[0].status).toEqual('archived');
    });

    it('completedフィルタで絞り込めるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ウニプロジェクト' }),
      });
      const { project } = await created.json();

      await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const res = await app.request('/api/projects?status=completed');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.projects).toHaveLength(1);
      expect(json.projects[0].status).toEqual('completed');
    });

    it('不正なstatusフィルタやと空リストが返るんやで', async () => {
      await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イクラプロジェクト' }),
      });

      const res = await app.request('/api/projects?status=invalid');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.projects).toEqual([]);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('IDでプロジェクトが取得できるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロプロジェクト', description: 'まぐろの説明' }),
      });
      const { project: createdProject } = await created.json();

      const res = await app.request(`/api/projects/${createdProject.id}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.project.id).toEqual(createdProject.id);
      expect(json.project.name).toEqual('マグロプロジェクト');
      expect(json.project.description).toEqual('まぐろの説明');
    });

    it('存在しないIDやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000');
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Project not found');
    });
  });

  describe('POST /api/projects', () => {
    it('プロジェクトが正しく作成されるんやで', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロプロジェクト' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.project.name).toEqual('マグロプロジェクト');
      expect(json.project.status).toEqual('active');
      expect(json.project.id).toBeDefined();
      expect(json.project.createdAt).toBeDefined();
      expect(json.project.updatedAt).toBeDefined();
    });

    it('descriptionも含めてプロジェクトが作成されるんやで', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモンプロジェクト', description: 'さーもんの説明' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.project.name).toEqual('サーモンプロジェクト');
      expect(json.project.description).toEqual('さーもんの説明');
    });

    it('nameがなかったら400返すねん', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Name is required');
    });

    it('サロゲートペア文字を含む名前でもプロジェクトが作成できるんやで', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '森鷗外プロジェクト' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.project.name).toEqual('森鷗外プロジェクト');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('プロジェクトのnameが更新されるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'エビプロジェクト' }),
      });
      const { project } = await created.json();

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イカプロジェクト' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.project.name).toEqual('イカプロジェクト');
    });

    it('プロジェクトのstatusがarchivedに更新されるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ウニプロジェクト' }),
      });
      const { project } = await created.json();

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.project.status).toEqual('archived');
    });

    it('プロジェクトのstatusがcompletedに更新されるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イクラプロジェクト' }),
      });
      const { project } = await created.json();

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.project.status).toEqual('completed');
    });

    it('存在しないIDやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロプロジェクト' }),
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Project not found');
    });

    it('不正なstatusやったら400返すねん', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモンプロジェクト' }),
      });
      const { project } = await created.json();

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'invalid_status' }),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Invalid status');
    });

    it('サロゲートペア文字を含む名前に更新できるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'エビプロジェクト' }),
      });
      const { project } = await created.json();

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '森鷗外プロジェクト' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.project.name).toEqual('森鷗外プロジェクト');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('プロジェクトが削除されるんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロプロジェクト' }),
      });
      const { project } = await created.json();

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual('Project deleted');
    });

    it('削除後に取得しようとすると404が返るんやで', async () => {
      const created = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモンプロジェクト' }),
      });
      const { project } = await created.json();

      await app.request(`/api/projects/${project.id}`, { method: 'DELETE' });

      const res = await app.request(`/api/projects/${project.id}`);
      expect(res.status).toEqual(404);
    });

    it('存在しないIDやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Project not found');
    });
  });

  describe('GET /api/projects/:id/tasks', () => {
    it('プロジェクトのタスク一覧が取得できるんやで', async () => {
      const createdProject = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'エビプロジェクト' }),
      });
      const { project } = await createdProject.json();

      await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'マグロタスク', projectId: project.id }),
      });
      await app.request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'サーモンタスク', projectId: project.id }),
      });

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks).toHaveLength(2);
      expect(json.tasks.every((t: { projectId: string }) => t.projectId === project.id)).toEqual(true);
    });

    it('プロジェクトにタスクがなかったら空一覧が返るんやで', async () => {
      const createdProject = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イカプロジェクト' }),
      });
      const { project } = await createdProject.json();

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tasks).toEqual([]);
    });

    it('存在しないプロジェクトIDやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000/tasks');
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Project not found');
    });
  });
});
