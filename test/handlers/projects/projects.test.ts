// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { commentStore } from '../../../src/store/commentStore';
import { tagStore } from '../../../src/store/tagStore';
import { taskStore } from '../../../src/store/taskStore';
import { milestoneStore } from '../../../src/store/milestoneStore';
import { projectStore } from '../../../src/store/projectStore';
import type { Project } from '../../../src/types/project';

beforeAll(() => {
  console.log('[START] Projects Handlers');
});

afterAll(() => {
  console.log('[END] Projects Handlers');
});

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await milestoneStore.reset();
  await projectStore.reset();
});

/**
 * プロジェクトを作成するヘルパー関数
 * @param name - プロジェクト名
 * @param description - プロジェクトの説明
 * @returns 作成されたプロジェクト
 */
const createProject = async (name: string, description?: string): Promise<Project> => {
  const res = await app.request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  return data.project;
};

describe('Projects Handlers', () => {
  describe('GET /api/projects', () => {
    it('プロジェクト一覧が空のとき空配列を返すんやで', async () => {
      const res = await app.request('/api/projects');
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.projects).toEqual([]);
    });

    it('プロジェクト一覧を正しく返すんやで', async () => {
      await createProject('マグロプロジェクト');
      await createProject('サーモンプロジェクト');

      const res = await app.request('/api/projects');
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.projects.length).toEqual(2);
    });

    it('ステータスフィルターで絞り込めるんやで', async () => {
      const project = await createProject('マグロプロジェクト');
      await createProject('サーモンプロジェクト');

      await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      const res = await app.request('/api/projects?status=archived');
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.projects.length).toEqual(1);
      expect(data.projects[0].status).toEqual('archived');
    });

    it('該当するステータスがないとき空配列を返すんやで', async () => {
      await createProject('マグロプロジェクト');

      const res = await app.request('/api/projects?status=completed');
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.projects).toEqual([]);
    });
  });

  describe('POST /api/projects', () => {
    it('プロジェクトが正しく作成されるんやで', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロプロジェクト', description: '最高級のマグロ' }),
      });
      expect(res.status).toEqual(201);
      const data = await res.json();
      expect(data.project.name).toEqual('マグロプロジェクト');
      expect(data.project.description).toEqual('最高級のマグロ');
      expect(data.project.status).toEqual('active');
      expect(data.project.id).toBeDefined();
      expect(data.project.createdAt).toBeDefined();
      expect(data.project.updatedAt).toBeDefined();
    });

    it('名前なしやったら400返すねん', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);
      const data = await res.json();
      expect(data.error).toEqual('Name is required');
    });

    it('説明なしでもプロジェクトが作れるんやで', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'エビプロジェクト' }),
      });
      expect(res.status).toEqual(201);
      const data = await res.json();
      expect(data.project.name).toEqual('エビプロジェクト');
      expect(data.project.description).toEqual('');
    });

    it('サロゲートペア文字を含む名前でもプロジェクトが作れるんやで', async () => {
      const res = await app.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '森鷗外プロジェクト' }),
      });
      expect(res.status).toEqual(201);
      const data = await res.json();
      expect(data.project.name).toEqual('森鷗外プロジェクト');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('IDを指定してプロジェクトを取得できるんやで', async () => {
      const project = await createProject('マグロプロジェクト', '新鮮なマグロ');

      const res = await app.request(`/api/projects/${project.id}`);
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.project.id).toEqual(project.id);
      expect(data.project.name).toEqual('マグロプロジェクト');
      expect(data.project.description).toEqual('新鮮なマグロ');
    });

    it('存在しないIDやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000');
      expect(res.status).toEqual(404);
      const data = await res.json();
      expect(data.error).toEqual('Project not found');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('プロジェクトの名前を更新できるんやで', async () => {
      const project = await createProject('マグロプロジェクト');

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモンプロジェクト' }),
      });
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.project.name).toEqual('サーモンプロジェクト');
    });

    it('プロジェクトのステータスを更新できるんやで', async () => {
      const project = await createProject('マグロプロジェクト');

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.project.status).toEqual('completed');
    });

    it('無効なステータスやったら400返すねん', async () => {
      const project = await createProject('マグロプロジェクト');

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'invalid_status' }),
      });
      expect(res.status).toEqual(400);
      const data = await res.json();
      expect(data.error).toEqual('Invalid status');
    });

    it('存在しないIDを更新しようとしたら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモンプロジェクト' }),
      });
      expect(res.status).toEqual(404);
      const data = await res.json();
      expect(data.error).toEqual('Project not found');
    });

    it('説明とステータスをまとめて更新できるんやで', async () => {
      const project = await createProject('マグロプロジェクト');

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: '極上のマグロ', status: 'archived' }),
      });
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.project.description).toEqual('極上のマグロ');
      expect(data.project.status).toEqual('archived');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('プロジェクトを削除できるんやで', async () => {
      const project = await createProject('マグロプロジェクト');

      const res = await app.request(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.message).toEqual('Project deleted');

      const getRes = await app.request(`/api/projects/${project.id}`);
      expect(getRes.status).toEqual(404);
    });

    it('存在しないIDを削除しようとしたら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
      const data = await res.json();
      expect(data.error).toEqual('Project not found');
    });
  });

  describe('GET /api/projects/:id/tasks', () => {
    it('プロジェクトに紐づくタスク一覧を取得できるんやで', async () => {
      const project = await createProject('マグロプロジェクト');

      await taskStore.create({ title: 'マグロを仕入れる', projectId: project.id });
      await taskStore.create({ title: 'マグロを捌く', projectId: project.id });

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.tasks.length).toEqual(2);
    });

    it('タスクがないプロジェクトやったら空配列を返すんやで', async () => {
      const project = await createProject('サーモンプロジェクト');

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.tasks).toEqual([]);
    });

    it('存在しないプロジェクトIDやったら404返すねん', async () => {
      const res = await app.request('/api/projects/00000000-0000-0000-0000-000000000000/tasks');
      expect(res.status).toEqual(404);
      const data = await res.json();
      expect(data.error).toEqual('Project not found');
    });

    it('他のプロジェクトのタスクは含まれへんで', async () => {
      const project1 = await createProject('マグロプロジェクト');
      const project2 = await createProject('サーモンプロジェクト');

      await taskStore.create({ title: 'マグロを仕入れる', projectId: project1.id });
      await taskStore.create({ title: 'サーモンを仕入れる', projectId: project2.id });

      const res = await app.request(`/api/projects/${project1.id}/tasks`);
      expect(res.status).toEqual(200);
      const data = await res.json();
      expect(data.tasks.length).toEqual(1);
      expect(data.tasks[0].title).toEqual('マグロを仕入れる');
    });
  });
});
