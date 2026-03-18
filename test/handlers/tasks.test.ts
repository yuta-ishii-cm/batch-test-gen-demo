// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { taskStore } from "../../src/store/taskStore";
import { tagStore } from "../../src/store/tagStore";

describe("Tasks Handlers", () => {
  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
  });

  describe("GET /api/tasks", () => {
    it("タスクが空やったら空配列返すねん", async () => {
      const res = await app.request("/api/tasks");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({ tasks: [] });
    });

    it("全タスク取得できるんやで", async () => {
      await taskStore.create({ title: "タスク1" });
      await taskStore.create({ title: "タスク2" });

      const res = await app.request("/api/tasks");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toHaveLength(2);
    });

    it("statusでフィルタリングできるっちゅうねん", async () => {
      await taskStore.create({ title: "タスク1", status: "todo" });
      await taskStore.create({ title: "タスク2", status: "done" });
      await taskStore.create({ title: "タスク3", status: "todo" });

      const res = await app.request("/api/tasks?status=todo");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toHaveLength(2);
      expect(json.tasks.every((t: { status: string }) => t.status === "todo")).toEqual(true);
    });

    it("存在せんstatusでフィルタしたら空配列やねん", async () => {
      await taskStore.create({ title: "タスク1", status: "todo" });

      const res = await app.request("/api/tasks?status=in_progress");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toEqual([]);
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("IDでタスク取得できるんやで", async () => {
      const created = await taskStore.create({ title: "テストタスク" });

      const res = await app.request(`/api/tasks/${created.id}`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.task.id).toEqual(created.id);
      expect(json.task.title).toEqual("テストタスク");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000");
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Task not found" });
    });
  });

  describe("POST /api/tasks", () => {
    it("タスクが正しく作成されるんやで", async () => {
      const res = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "新しいタスク", description: "説明文やで" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.task.title).toEqual("新しいタスク");
      expect(json.task.description).toEqual("説明文やで");
      expect(json.task.status).toEqual("todo");
    });

    it("statusを指定して作成できるんやで", async () => {
      const res = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "進行中タスク", status: "in_progress" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.task.status).toEqual("in_progress");
    });

    it("titleが無かったら400返すっちゅうねん", async () => {
      const res = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "タイトル無しやで" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Title is required" });
    });

    it("不正なstatusやったら400になるねん", async () => {
      const res = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "テスト", status: "invalid_status" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Invalid status" });
    });

    it("森鷗外をタイトルに使っても正しく作成されるんやで", async () => {
      const res = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "森鷗外の小説を読む" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.task.title).toEqual("森鷗外の小説を読む");
    });

    it("空文字のtitleやったら400返すねん", async () => {
      const res = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Title is required" });
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("タスクを更新できるんやで", async () => {
      const created = await taskStore.create({ title: "更新前" });

      const res = await app.request(`/api/tasks/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "更新後", status: "done" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.task.title).toEqual("更新後");
      expect(json.task.status).toEqual("done");
    });

    it("存在しないタスクを更新しようとしたら404やねん", async () => {
      const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "存在せんで" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Task not found" });
    });

    it("不正なstatusで更新しようとしたら400になるっちゅうねん", async () => {
      const created = await taskStore.create({ title: "テスト" });

      const res = await app.request(`/api/tasks/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Invalid status" });
    });

    it("森鷗外をdescriptionに使っても正しく更新されるんやで", async () => {
      const created = await taskStore.create({ title: "テスト" });

      const res = await app.request(`/api/tasks/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "森鷗外についてのメモ" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.task.description).toEqual("森鷗外についてのメモ");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("タスクを削除できるんやで", async () => {
      const created = await taskStore.create({ title: "削除するタスク" });

      const res = await app.request(`/api/tasks/${created.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({ message: "Task deleted" });

      const check = await taskStore.getById(created.id);
      expect(check).toEqual(null);
    });

    it("存在しないタスクを削除しようとしたら404やねん", async () => {
      const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Task not found" });
    });
  });

  describe("GET /api/tasks/stats", () => {
    it("タスクが無いときはゼロで返すんやで", async () => {
      const res = await app.request("/api/tasks/stats");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({
        total: 0,
        byStatus: { todo: 0, in_progress: 0, done: 0 },
      });
    });

    it("ステータスごとの統計がちゃんと出るんやで", async () => {
      await taskStore.create({ title: "タスク1", status: "todo" });
      await taskStore.create({ title: "タスク2", status: "todo" });
      await taskStore.create({ title: "タスク3", status: "in_progress" });
      await taskStore.create({ title: "タスク4", status: "done" });

      const res = await app.request("/api/tasks/stats");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({
        total: 4,
        byStatus: { todo: 2, in_progress: 1, done: 1 },
      });
    });
  });

  describe("GET /api/tasks/search", () => {
    it("キーワードでタスクを検索できるんやで", async () => {
      await taskStore.create({ title: "買い物に行く" });
      await taskStore.create({ title: "本を読む" });
      await taskStore.create({ title: "買い物リスト作成" });

      const res = await app.request("/api/tasks/search?q=買い物");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toHaveLength(2);
    });

    it("descriptionも検索対象になるんやで", async () => {
      await taskStore.create({ title: "タスク", description: "森鷗外の作品を調べる" });

      const res = await app.request(`/api/tasks/search?q=${encodeURIComponent("森鷗外")}`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toHaveLength(1);
    });

    it("クエリパラメータが無かったら400返すっちゅうねん", async () => {
      const res = await app.request("/api/tasks/search");
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Query parameter 'q' is required" });
    });

    it("ヒットせんかったら空配列で返すねん", async () => {
      await taskStore.create({ title: "テストタスク" });

      const res = await app.request("/api/tasks/search?q=存在しないキーワード");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toEqual([]);
    });

    it("大文字小文字を区別せんで検索できるんやで", async () => {
      await taskStore.create({ title: "Hello World" });

      const res = await app.request("/api/tasks/search?q=hello");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toHaveLength(1);
    });
  });

  describe("GET /api/tasks/:id/tags", () => {
    it("タスクのタグ一覧を取得できるんやで", async () => {
      const task = await taskStore.create({ title: "テスト" });
      const tag = await tagStore.create({ name: "重要" });
      await tagStore.addToTask(task.id, tag.id);

      const res = await app.request(`/api/tasks/${task.id}/tags`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tags).toHaveLength(1);
      expect(json.tags[0].name).toEqual("重要");
    });

    it("タグが無いタスクやったら空配列返すねん", async () => {
      const task = await taskStore.create({ title: "テスト" });

      const res = await app.request(`/api/tasks/${task.id}/tags`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tags).toEqual([]);
    });

    it("存在しないタスクのタグ取得しようとしたら404やねん", async () => {
      const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000/tags");
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Task not found" });
    });
  });

  describe("POST /api/tasks/:id/tags", () => {
    it("タスクにタグを追加できるんやで", async () => {
      const task = await taskStore.create({ title: "テスト" });
      const tag = await tagStore.create({ name: "バグ" });

      const res = await app.request(`/api/tasks/${task.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.tags).toHaveLength(1);
      expect(json.tags[0].name).toEqual("バグ");
    });

    it("tagIdが無かったら400返すっちゅうねん", async () => {
      const task = await taskStore.create({ title: "テスト" });

      const res = await app.request(`/api/tasks/${task.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "tagId is required" });
    });

    it("存在しないタスクにタグ追加しようとしたら404やねん", async () => {
      const tag = await tagStore.create({ name: "テスト" });

      const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Task not found" });
    });

    it("存在しないタグを追加しようとしたら404やねん", async () => {
      const task = await taskStore.create({ title: "テスト" });

      const res = await app.request(`/api/tasks/${task.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: "00000000-0000-0000-0000-000000000000" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Tag not found" });
    });
  });

  describe("DELETE /api/tasks/:id/tags/:tagId", () => {
    it("タスクからタグを削除できるんやで", async () => {
      const task = await taskStore.create({ title: "テスト" });
      const tag = await tagStore.create({ name: "削除するタグ" });
      await tagStore.addToTask(task.id, tag.id);

      const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({ message: "Tag removed from task" });
    });

    it("存在しないタスクからタグ削除しようとしたら404やねん", async () => {
      const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000/tags/00000000-0000-0000-0000-000000000001", {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Task not found" });
    });

    it("タスクに紐づいてないタグを削除しようとしたら404やねん", async () => {
      const task = await taskStore.create({ title: "テスト" });
      const tag = await tagStore.create({ name: "紐づいてないタグ" });

      const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "Tag not found on this task" });
    });
  });
});
