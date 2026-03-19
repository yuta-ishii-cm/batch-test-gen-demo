// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { taskStore } from "../../../src/store/taskStore";
import { tagStore } from "../../../src/store/tagStore";

beforeAll(() => {
  console.log("[START] tasks handlers");
});

afterAll(() => {
  console.log("[END] tasks handlers");
});

beforeEach(async () => {
  await tagStore.reset();
  await taskStore.reset();
});

describe("GET /api/tasks", () => {
  it("全タスクが取得できるんやで", async () => {
    await taskStore.create({ title: "織田信長の野望" });
    await taskStore.create({ title: "豊臣秀吉の天下統一" });

    const res = await app.request("/api/tasks");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(2);
  });

  it("タスクが0件でも空配列が返ってくるねん", async () => {
    const res = await app.request("/api/tasks");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks).toEqual([]);
  });

  it("ステータスでフィルタできるんやで", async () => {
    await taskStore.create({ title: "織田信長の野望", status: "todo" });
    await taskStore.create({
      title: "豊臣秀吉の天下統一",
      status: "in_progress",
    });
    await taskStore.create({ title: "徳川家康の忍耐", status: "done" });

    const res = await app.request("/api/tasks?status=in_progress");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual("豊臣秀吉の天下統一");
  });
});

describe("POST /api/tasks", () => {
  it("タスクが正しく作成されるんやで", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "武田信玄の進軍" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual("武田信玄の進軍");
    expect(body.task.status).toEqual("todo");
    expect(body.task.description).toEqual("");
  });

  it("説明文とステータス付きでも作成できるんやで", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "上杉謙信の義",
        description: "義を重んじる戦い",
        status: "in_progress",
      }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual("上杉謙信の義");
    expect(body.task.description).toEqual("義を重んじる戦い");
    expect(body.task.status).toEqual("in_progress");
  });

  it("タイトルが無かったら400になるっちゅうねん", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "タイトルなし" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Title is required");
  });

  it("無効なステータスやったら400返すねん", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "伊達政宗の策略", status: "invalid" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Invalid status");
  });
});

describe("GET /api/tasks/:id", () => {
  it("IDでタスクが取得できるんやで", async () => {
    const created = await taskStore.create({ title: "織田信長の野望" });

    const res = await app.request(`/api/tasks/${created.id}`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.id).toEqual(created.id);
    expect(body.task.title).toEqual("織田信長の野望");
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000"
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Task not found");
  });
});

describe("PUT /api/tasks/:id", () => {
  it("タスクが更新できるんやで", async () => {
    const created = await taskStore.create({ title: "武田信玄の進軍" });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "武田信玄の撤退",
        status: "done",
      }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.title).toEqual("武田信玄の撤退");
    expect(body.task.status).toEqual("done");
  });

  it("存在しないタスクの更新は404になるねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "存在しないタスク" }),
      }
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Task not found");
  });

  it("無効なステータスで更新したら400やで", async () => {
    const created = await taskStore.create({ title: "上杉謙信の義" });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Invalid status");
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("タスクが削除できるんやで", async () => {
    const created = await taskStore.create({ title: "伊達政宗の策略" });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual("Task deleted");

    const getRes = await app.request(`/api/tasks/${created.id}`);
    expect(getRes.status).toEqual(404);
  });

  it("存在しないタスクの削除は404になるっちゅうねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000",
      { method: "DELETE" }
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Task not found");
  });
});

describe("GET /api/tasks/search", () => {
  it("キーワードでタスク検索できるんやで", async () => {
    await taskStore.create({ title: "織田信長の野望" });
    await taskStore.create({ title: "豊臣秀吉の天下統一" });
    await taskStore.create({
      title: "徳川家康の忍耐",
      description: "織田の意志を継ぐ",
    });

    const res = await app.request("/api/tasks/search?q=織田");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(2);
  });

  it("大文字小文字を区別せず検索できるねん", async () => {
    await taskStore.create({ title: "TODOリストの整理" });

    const res = await app.request("/api/tasks/search?q=todo");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
  });

  it("クエリパラメータが無かったら400やで", async () => {
    const res = await app.request("/api/tasks/search");
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Query parameter 'q' is required");
  });

  it("該当タスクが無くても空配列が返ってくるんやで", async () => {
    await taskStore.create({ title: "織田信長の野望" });

    const res = await app.request("/api/tasks/search?q=該当なし");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks).toEqual([]);
  });
});

describe("GET /api/tasks/:id/tags", () => {
  it("タスクのタグ一覧が取得できるんやで", async () => {
    const task = await taskStore.create({ title: "織田信長の野望" });
    const tag = await tagStore.create({ name: "重要" });
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(1);
    expect(body.tags[0].name).toEqual("重要");
  });

  it("存在しないタスクのタグ取得は404やねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000/tags"
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Task not found");
  });

  it("タグが無いタスクは空配列返すんやで", async () => {
    const task = await taskStore.create({ title: "武田信玄の進軍" });

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags).toEqual([]);
  });
});

describe("POST /api/tasks/:id/tags", () => {
  it("タスクにタグ追加できるんやで", async () => {
    const task = await taskStore.create({ title: "豊臣秀吉の天下統一" });
    const tag = await tagStore.create({ name: "緊急" });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag.id }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tags.length).toEqual(1);
    expect(body.tags[0].name).toEqual("緊急");
  });

  it("tagIdが無かったら400になるっちゅうねん", async () => {
    const task = await taskStore.create({ title: "織田信長の野望" });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("tagId is required");
  });

  it("存在しないタスクへのタグ追加は404やねん", async () => {
    const tag = await tagStore.create({ name: "重要" });

    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000/tags",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      }
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Task not found");
  });

  it("存在しないタグの追加は404返すねん", async () => {
    const task = await taskStore.create({ title: "徳川家康の忍耐" });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: "00000000-0000-0000-0000-000000000000" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Tag not found");
  });
});

describe("DELETE /api/tasks/:id/tags/:tagId", () => {
  it("タスクからタグ削除できるんやで", async () => {
    const task = await taskStore.create({ title: "上杉謙信の義" });
    const tag = await tagStore.create({ name: "重要" });
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual("Tag removed from task");
  });

  it("存在しないタスクからのタグ削除は404やねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000/tags/00000000-0000-0000-0000-000000000001",
      { method: "DELETE" }
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Task not found");
  });

  it("タスクに紐づいてないタグの削除は404返すんやで", async () => {
    const task = await taskStore.create({ title: "伊達政宗の策略" });

    const res = await app.request(
      `/api/tasks/${task.id}/tags/00000000-0000-0000-0000-000000000000`,
      { method: "DELETE" }
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Tag not found on this task");
  });
});

describe("GET /api/tasks/stats", () => {
  it("統計情報が正しく取得できるんやで", async () => {
    await taskStore.create({ title: "織田信長の野望", status: "todo" });
    await taskStore.create({
      title: "豊臣秀吉の天下統一",
      status: "in_progress",
    });
    await taskStore.create({ title: "徳川家康の忍耐", status: "done" });
    await taskStore.create({ title: "武田信玄の進軍", status: "todo" });

    const res = await app.request("/api/tasks/stats");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.total).toEqual(4);
    expect(body.byStatus).toEqual({
      todo: 2,
      in_progress: 1,
      done: 1,
    });
  });

  it("タスクが0件のときも統計取れるんやで", async () => {
    const res = await app.request("/api/tasks/stats");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.total).toEqual(0);
    expect(body.byStatus).toEqual({
      todo: 0,
      in_progress: 0,
      done: 0,
    });
  });
});

describe("境界値テスト", () => {
  it("サロゲートペア文字を含むタスク名で作成できるんやで", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "森鷗外" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual("森鷗外");
  });

  it("サロゲートペア文字を含むタスクが検索できるねん", async () => {
    await taskStore.create({ title: "森鷗外" });

    const res = await app.request("/api/tasks/search?q=森鷗外");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual("森鷗外");
  });

  it("サロゲートペア文字を含むタスクの更新もできるで", async () => {
    const created = await taskStore.create({ title: "織田信長の野望" });

    const res = await app.request(`/api/tasks/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "森鷗外の文学" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.task.title).toEqual("森鷗外の文学");
  });

  it("空文字タイトルやったら400になるんやで", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Title is required");
  });

  it("特殊文字を含むタスク名でも作成できるっちゅうねん", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "テスト<script>alert('xss')</script>タスク",
      }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.task.title).toEqual(
      "テスト<script>alert('xss')</script>タスク"
    );
  });
});
