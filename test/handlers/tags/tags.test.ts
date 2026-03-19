// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { tagStore } from '../../../src/store/tagStore';

describe('Tags Handlers', () => {
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
    it('タグが1件もない時に空の配列が返ってくるんやで', async () => {
      const res = await app.request('/api/tags');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tags).toEqual([]);
    });

    it('作成したタグが一覧で取得できるんやで', async () => {
      await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロ' }),
      });
      await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモン' }),
      });
      const res = await app.request('/api/tags');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tags).toHaveLength(2);
    });

    it('タグ一覧のレスポンスに必要なフィールドが揃っとるで', async () => {
      await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'エビ', color: '#FF5733' }),
      });
      const res = await app.request('/api/tags');
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.tags[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'エビ',
          color: '#FF5733',
          createdAt: expect.any(String),
        })
      );
    });
  });

  describe('POST /api/tags', () => {
    it('タグが正しく作成できるんやで', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'マグロ' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.tag.name).toEqual('マグロ');
    });

    it('colorを指定してタグを作成できるんやで', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'サーモン', color: '#FF6B6B' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.tag.name).toEqual('サーモン');
      expect(json.tag.color).toEqual('#FF6B6B');
    });

    it('colorなしで作成したらデフォルト色が設定されるんやで', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イカ' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.tag.color).toEqual('#6b7280');
    });

    it('作成したタグにidとcreatedAtが含まれとるで', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'タマゴ' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.tag).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'タマゴ',
          createdAt: expect.any(String),
        })
      );
    });

    it('nameなしやったら400返すねん', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toEqual(400);
    });

    it('nameが空文字やったら400返すねん', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });
      expect(res.status).toEqual(400);
    });

    it('nameが重複したら409か500が返ってくるんやで', async () => {
      await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ウニ' }),
      });
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ウニ' }),
      });
      expect([409, 500]).toContain(res.status);
    });

    it('サロゲートペア文字「森鷗外」を含む名前のタグが作成できるんやで', async () => {
      const res = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '森鷗外' }),
      });
      expect(res.status).toEqual(201);
      const json = await res.json();
      expect(json.tag.name).toEqual('森鷗外');
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('タグが正しく削除できるんやで', async () => {
      const createRes = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'イクラ' }),
      });
      const createJson = await createRes.json();
      const tagId = createJson.tag.id;

      const res = await app.request(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(200);
      const json = await res.json();
      expect(json.message).toEqual('Tag deleted');
    });

    it('削除後にタグ一覧から消えとるで', async () => {
      const createRes = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'アナゴ' }),
      });
      const createJson = await createRes.json();
      const tagId = createJson.tag.id;

      await app.request(`/api/tags/${tagId}`, { method: 'DELETE' });

      const listRes = await app.request('/api/tags');
      const listJson = await listRes.json();
      expect(listJson.tags).toHaveLength(0);
    });

    it('存在しないIDやったら404返すねん', async () => {
      const res = await app.request(
        '/api/tags/00000000-0000-0000-0000-000000000000',
        { method: 'DELETE' }
      );
      expect(res.status).toEqual(404);
    });

    it('すでに削除したタグを再度削除しようとしたら404になるんやで', async () => {
      const createRes = await app.request('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ホタテ' }),
      });
      const createJson = await createRes.json();
      const tagId = createJson.tag.id;

      await app.request(`/api/tags/${tagId}`, { method: 'DELETE' });
      const res = await app.request(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });
      expect(res.status).toEqual(404);
    });
  });
});
