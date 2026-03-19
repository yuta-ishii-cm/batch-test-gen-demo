// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from '../../../src/app';
import { taskStore } from '../../../src/store/taskStore';
import { tagStore } from '../../../src/store/tagStore';

describe('GET /api/tasks/search - searchTasks', () => {
  beforeAll(() => {
    console.log('[START] GET /api/tasks/search - searchTasks');
  });

  afterAll(() => {
    console.log('[END] GET /api/tasks/search - searchTasks');
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  it('タイトルでタスクを検索できるんやで', async () => {
    await taskStore.create({ title: '織田信長の野望' });
    await taskStore.create({ title: '豊臣秀吉の天下統一' });
    await taskStore.create({ title: '徳川家康の忍耐' });

    const res = await app.request('/api/tasks/search?q=織田');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual('織田信長の野望');
  });

  it('説明文でもタスクを検索できるんやで', async () => {
    await taskStore.create({ title: '武田信玄の進軍', description: '甲斐の虎と呼ばれた武将' });
    await taskStore.create({ title: '上杉謙信の義', description: '越後の龍と呼ばれた武将' });

    const res = await app.request('/api/tasks/search?q=甲斐');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual('武田信玄の進軍');
  });

  it('クエリパラメータqがないと400返すっちゅうねん', async () => {
    const res = await app.request('/api/tasks/search');
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Query parameter 'q' is required");
  });

  it('検索結果がないときは空配列返すねん', async () => {
    await taskStore.create({ title: '織田信長の野望' });

    const res = await app.request('/api/tasks/search?q=存在しないキーワード');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks).toEqual([]);
  });

  it('大文字小文字を区別せずに検索できるんやで', async () => {
    await taskStore.create({ title: 'Task of Nobunaga', description: '' });

    const res = await app.request('/api/tasks/search?q=task');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
  });

  it('サロゲートペア文字（森鷗外）で検索できるっちゅうねん', async () => {
    await taskStore.create({ title: '森鷗外の策略' });
    await taskStore.create({ title: '伊達政宗の策略' });

    const res = await app.request('/api/tasks/search?q=森鷗外');
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual('森鷗外の策略');
  });
});
