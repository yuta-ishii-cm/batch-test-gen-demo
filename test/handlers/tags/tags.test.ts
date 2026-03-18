// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { tagStore } from '../../../src/store/tagStore';

/** タグ作成のPOSTリクエストを送る */
const postTag = (body: Record<string, unknown>) =>
  app.request('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeAll(() => {
  console.log('[START] Tags Handlers');
});

afterAll(() => {
  console.log('[END] Tags Handlers');
});

beforeEach(async () => {
  await tagStore.reset();
});

describe('GET /api/tags', () => {
  it('タグ一覧が空のとき空配列を返すんやで', async () => {
    const res = await app.request('/api/tags');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tags).toEqual([]);
  });

  it('作成したタグが一覧に含まれとるんやで', async () => {
    await postTag({ name: 'マグロ' });
    await postTag({ name: 'サーモン' });

    const res = await app.request('/api/tags');
    expect(res.status).toEqual(200);
    const data = await res.json();
    expect(data.tags.length).toEqual(2);

    const names = data.tags.map((t: { name: string }) => t.name);
    expect(names).toContain('マグロ');
    expect(names).toContain('サーモン');
  });
});

describe('POST /api/tags', () => {
  it('タグが正しく作成されるんやで', async () => {
    const res = await postTag({ name: 'エビ' });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.tag.name).toEqual('エビ');
    expect(data.tag.id).toBeDefined();
    expect(data.tag.createdAt).toBeDefined();
  });

  it('色を指定せんかったらデフォルトの#6b7280になるっちゅうねん', async () => {
    const res = await postTag({ name: 'イカ' });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.tag.color).toEqual('#6b7280');
  });

  it('カスタムカラーを指定したらその色になるんやで', async () => {
    const res = await postTag({ name: 'タマゴ', color: '#fbbf24' });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.tag.name).toEqual('タマゴ');
    expect(data.tag.color).toEqual('#fbbf24');
  });

  it('名前がなかったら400になるっちゅうねん', async () => {
    const res = await postTag({});
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Name is required');
  });

  it('名前が空文字でも400になるんやで', async () => {
    const res = await postTag({ name: '' });
    expect(res.status).toEqual(400);
    const data = await res.json();
    expect(data.error).toEqual('Name is required');
  });

  it('サロゲートペア文字を含む名前でもタグが作れるんやで', async () => {
    const res = await postTag({ name: '森鷗外タグ' });
    expect(res.status).toEqual(201);
    const data = await res.json();
    expect(data.tag.name).toEqual('森鷗外タグ');
  });
});

describe('DELETE /api/tags/:id', () => {
  it('タグが削除できるんやで', async () => {
    const createRes = await postTag({ name: 'ウニ' });
    const { tag } = await createRes.json();

    const deleteRes = await app.request(`/api/tags/${tag.id}`, {
      method: 'DELETE',
    });
    expect(deleteRes.status).toEqual(200);
    const data = await deleteRes.json();
    expect(data.message).toEqual('Tag deleted');

    const listRes = await app.request('/api/tags');
    const listData = await listRes.json();
    expect(listData.tags.length).toEqual(0);
  });

  it('存在せんタグを削除しようとしたら404になるっちゅうねん', async () => {
    const res = await app.request('/api/tags/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    expect(res.status).toEqual(404);
    const data = await res.json();
    expect(data.error).toEqual('Tag not found');
  });
});
