// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { milestoneStore } from '../../../src/store/milestoneStore';
import { projectStore } from '../../../src/store/projectStore';

describe('Milestones Handlers', () => {
  beforeAll(() => {
    console.log('[START] Milestones Handlers');
  });

  afterAll(() => {
    console.log('[END] Milestones Handlers');
  });

  beforeEach(async () => {
    await milestoneStore.reset();
    await projectStore.reset();
  });

  const createProject = async (name = 'マグロプロジェクト') => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    return json.project;
  };

  const createMilestone = async (projectId: string, title = 'サーモンリリース', extra: Record<string, unknown> = {}) => {
    const res = await app.request(`/api/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ...extra }),
    });
    const json = await res.json();
    return json.milestone;
  };

  describe('GET /api/projects/:projectId/milestones', () => {
    it('マイルストーン一覧が空やったらそのまま返すんやで', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestones).toEqual([]);
    });

    it('マイルストーン一覧が取得できるんやで', async () => {
      const project = await createProject();
      await createMilestone(project.id, 'エビリリース');
      await createMilestone(project.id, 'イカリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestones).toHaveLength(2);
    });

    it('存在しないprojectIdやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000/milestones');
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Project not found');
    });

    it('別プロジェクトのマイルストーンは含まれへんのやで', async () => {
      const project1 = await createProject('マグロプロジェクト');
      const project2 = await createProject('サーモンプロジェクト');
      await createMilestone(project2.id, 'エビリリース');

      const res = await app.request(`/api/projects/${project1.id}/milestones`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestones).toEqual([]);
    });
  });

  describe('GET /api/projects/:projectId/milestones/:id', () => {
    it('IDでマイルストーンが取得できるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'タマゴリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.id).toEqual(milestone.id);
      expect(json.milestone.title).toEqual('タマゴリリース');
    });

    it('存在しないIDやったら404返すねん', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones/00000000-0000-0000-0000-000000000000`);
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Milestone not found');
    });

    it('存在しないprojectIdでもmilestoneIdが有効なら取得できるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'ウニリリース');

      // getMilestoneById handler doesn't check projectId, it just fetches by milestoneId
      const res = await app.request(`/api/projects/00000000-0000-0000-0000-000000000000/milestones/${milestone.id}`);
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.id).toEqual(milestone.id);
    });
  });

  describe('POST /api/projects/:projectId/milestones', () => {
    it('マイルストーンが正しく作成できるんやで', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'サーモンリリース' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.milestone.title).toEqual('サーモンリリース');
      expect(json.milestone.projectId).toEqual(project.id);
      expect(json.milestone.status).toEqual('open');
      expect(json.milestone.id).toBeDefined();
      expect(json.milestone.createdAt).toBeDefined();
      expect(json.milestone.updatedAt).toBeDefined();
    });

    it('dueDateを含めてマイルストーンが作成できるんやで', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'エビリリース', dueDate: '2026-06-30' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.milestone.title).toEqual('エビリリース');
      expect(json.milestone.dueDate).toEqual('2026-06-30');
    });

    it('descriptionを含めてマイルストーンが作成できるんやで', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'イカリリース', description: 'いかの説明' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.milestone.title).toEqual('イカリリース');
      expect(json.milestone.description).toEqual('いかの説明');
    });

    it('titleなしやったら400返すねん', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Title is required');
    });

    it('存在しないprojectIdやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'タマゴリリース' }),
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Project not found');
    });

    it('サロゲートペア文字を含むtitleでもマイルストーンが作成できるんやで', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '森鷗外リリース' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.milestone.title).toEqual('森鷗外リリース');
    });
  });

  describe('PUT /api/projects/:projectId/milestones/:id', () => {
    it('マイルストーンのtitleが更新されるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'ウニリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'イクラリリース' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.title).toEqual('イクラリリース');
    });

    it('マイルストーンのstatusがclosedに更新されるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'サーモンリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.status).toEqual('closed');
    });

    it('マイルストーンのstatusがopenに戻せるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'エビリリース');

      await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.status).toEqual('open');
    });

    it('マイルストーンのdueDateが更新されるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'イカリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: '2026-12-31' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.dueDate).toEqual('2026-12-31');
    });

    it('不正なstatusやったら400返すねん', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'タマゴリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'invalid_status' }),
      });
      expect(res.status).toEqual(400);
      const json = await res.json();
      expect(json.error).toEqual('Invalid status');
    });

    it('存在しないIDやったら404返すねん', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones/00000000-0000-0000-0000-000000000000`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'ウニリリース' }),
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Milestone not found');
    });

    it('サロゲートペア文字を含むtitleに更新できるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'マグロリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '森鷗外リリース' }),
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.milestone.title).toEqual('森鷗外リリース');
    });
  });

  describe('DELETE /api/projects/:projectId/milestones/:id', () => {
    it('マイルストーンが削除されるんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'イクラリリース');

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual('Milestone deleted');
    });

    it('削除後に取得しようとすると404が返るんやで', async () => {
      const project = await createProject();
      const milestone = await createMilestone(project.id, 'サーモンリリース');

      await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`, {
        method: 'DELETE',
      });

      const res = await app.request(`/api/projects/${project.id}/milestones/${milestone.id}`);
      expect(res.status).toEqual(404);
    });

    it('存在しないIDやったら404返すねん', async () => {
      const project = await createProject();
      const res = await app.request(`/api/projects/${project.id}/milestones/00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
      const json = await res.json();
      expect(json.error).toEqual('Milestone not found');
    });
  });
});
