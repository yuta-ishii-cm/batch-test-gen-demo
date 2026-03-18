// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { commentStore } from '../../../src/store/commentStore';
import { tagStore } from '../../../src/store/tagStore';
import { taskStore } from '../../../src/store/taskStore';
import { milestoneStore } from '../../../src/store/milestoneStore';
import { projectStore } from '../../../src/store/projectStore';
import type { Project } from '../../../src/types/project';

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';
let parentProject: Project;

beforeAll(() => {
  console.log('[START] Milestones Handlers');
});

afterAll(() => {
  console.log('[END] Milestones Handlers');
});

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await milestoneStore.reset();
  await projectStore.reset();
  parentProject = await projectStore.create({ name: 'マグロプロジェクト' });
});

describe('GET /api/projects/:projectId/milestones', () => {
  it('マイルストーン一覧が空配列で返ってくるんやで', async () => {
    const res = await app.request(`/api/projects/${parentProject.id}/milestones`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestones).toEqual([]);
  });

  it('作成したマイルストーンが一覧に含まれとるんやで', async () => {
    await milestoneStore.create(parentProject.id, { title: 'マグロマイルストーン' });
    await milestoneStore.create(parentProject.id, { title: 'サーモンマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestones.length).toEqual(2);
  });

  it('存在せんプロジェクトIDやったら404返すねん', async () => {
    const fakeId = NON_EXISTENT_ID;
    const res = await app.request(`/api/projects/${fakeId}/milestones`);
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Project not found');
  });
});

describe('POST /api/projects/:projectId/milestones', () => {
  it('マイルストーンが正しく作成されるんやで', async () => {
    const res = await app.request(`/api/projects/${parentProject.id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'マグロマイルストーン' }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.milestone.title).toEqual('マグロマイルストーン');
    expect(data.milestone.projectId).toEqual(parentProject.id);
    expect(data.milestone.status).toEqual('open');
  });

  it('説明と期日付きでマイルストーンが作れるんやで', async () => {
    const res = await app.request(`/api/projects/${parentProject.id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'イカマイルストーン',
        description: 'イカの鮮度が命やで',
        dueDate: '2026-12-31',
      }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.milestone.title).toEqual('イカマイルストーン');
    expect(data.milestone.description).toEqual('イカの鮮度が命やで');
    expect(data.milestone.dueDate).toEqual('2026-12-31');
  });

  it('タイトルがなかったら400になるっちゅうねん', async () => {
    const res = await app.request(`/api/projects/${parentProject.id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Title is required');
  });

  it('プロジェクトが存在せんかったら404返すねん', async () => {
    const fakeId = NON_EXISTENT_ID;
    const res = await app.request(`/api/projects/${fakeId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'エビマイルストーン' }),
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Project not found');
  });

  it('サロゲートペア文字を含むタイトルでもマイルストーンが作れるんやで', async () => {
    const res = await app.request(`/api/projects/${parentProject.id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '森鷗外マイルストーン' }),
    });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.milestone.title).toEqual('森鷗外マイルストーン');
  });

  it('空文字タイトルやったら400になるんやで', async () => {
    const res = await app.request(`/api/projects/${parentProject.id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Title is required');
  });
});

describe('GET /api/projects/:projectId/milestones/:milestoneId', () => {
  it('IDを指定してマイルストーンが取得できるんやで', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'タコマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`);
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestone.id).toEqual(created.id);
    expect(data.milestone.title).toEqual('タコマイルストーン');
  });

  it('存在せんマイルストーンIDやったら404返すねん', async () => {
    const fakeId = NON_EXISTENT_ID;
    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${fakeId}`);
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Milestone not found');
  });
});

describe('PUT /api/projects/:projectId/milestones/:milestoneId', () => {
  it('マイルストーンのタイトルが更新できるんやで', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'ウニマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'アワビマイルストーン' }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestone.title).toEqual('アワビマイルストーン');
  });

  it('ステータスをclosedに更新できるんやで', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'ハマチマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestone.status).toEqual('closed');
  });

  it('ステータスをopenに戻せるんやで', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'カンパチマイルストーン' });
    await milestoneStore.update(created.id, { status: 'closed' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestone.status).toEqual('open');
  });

  it('不正なステータスやったら400になるっちゅうねん', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'ヒラメマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid_status' }),
    });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Invalid status');
  });

  it('存在せんマイルストーンIDで更新しようとしたら404やねん', async () => {
    const fakeId = NON_EXISTENT_ID;
    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${fakeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'コハダマイルストーン' }),
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Milestone not found');
  });

  it('期日を更新できるんやで', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'シマアジマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: '2026-06-15' }),
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.milestone.dueDate).toEqual('2026-06-15');
  });
});

describe('DELETE /api/projects/:projectId/milestones/:milestoneId', () => {
  it('マイルストーンが削除できるんやで', async () => {
    const created = await milestoneStore.create(parentProject.id, { title: 'ホタテマイルストーン' });

    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.message).toEqual('Milestone deleted');

    const checkRes = await app.request(`/api/projects/${parentProject.id}/milestones/${created.id}`);
    expect(checkRes.status).toEqual(404);
  });

  it('存在せんマイルストーンIDを削除しようとしたら404やねん', async () => {
    const fakeId = NON_EXISTENT_ID;
    const res = await app.request(`/api/projects/${parentProject.id}/milestones/${fakeId}`, {
      method: 'DELETE',
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Milestone not found');
  });
});
