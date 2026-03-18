// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { projectStore } from "../../src/store/projectStore";
import { taskStore } from "../../src/store/taskStore";

describe("Projects Handlers", () => {
  beforeEach(async () => {
    await taskStore.reset();
    await projectStore.reset();
  });

  describe("GET /api/projects", () => {
    it("プロジェクト一覧が取得できるんやで", async () => {
      await projectStore.create({ name: "プロジェクトA" });
      await projectStore.create({ name: "プロジェクトB" });

      const res = await app.request("/api/projects");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.projects.length).toEqual(2);
    });

    it("プロジェクトがゼロ件でも空配列返すねん", async () => {
      const res = await app.request("/api/projects");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.projects).toEqual([]);
    });

    it("statusでフィルタリングできるんやで", async () => {
      const created = await projectStore.create({ name: "アーカイブ用" });
      await projectStore.update(created.id, { status: "archived" });
      await projectStore.create({ name: "アクティブなやつ" });

      const res = await app.request("/api/projects?status=archived");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.projects.length).toEqual(1);
      expect(json.projects[0].status).toEqual("archived");
    });

    it("存在せんstatusでフィルタしたら空配列やねん", async () => {
      await projectStore.create({ name: "テスト" });

      const res = await app.request("/api/projects?status=completed");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.projects).toEqual([]);
    });
  });

  describe("GET /api/projects/:id", () => {
    it("IDでプロジェクトが取得できるんやで", async () => {
      const created = await projectStore.create({
        name: "取得テスト",
        description: "説明文やで",
      });

      const res = await app.request(`/api/projects/${created.id}`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.project.name).toEqual("取得テスト");
      expect(json.project.description).toEqual("説明文やで");
      expect(json.project.status).toEqual("active");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request(
        "/api/projects/00000000-0000-0000-0000-000000000000"
      );
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json.error).toEqual("Project not found");
    });
  });

  describe("POST /api/projects", () => {
    it("プロジェクトが正しく作成されるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新しいプロジェクト", description: "詳細" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.project.name).toEqual("新しいプロジェクト");
      expect(json.project.description).toEqual("詳細");
      expect(json.project.status).toEqual("active");
      expect(json.project.id).toBeDefined();
    });

    it("nameがなかったら400返すねん", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "名前なしやで" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json.error).toEqual("Name is required");
    });

    it("nameが空文字やったら400返すねん", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json.error).toEqual("Name is required");
    });

    it("森鷗外のサロゲートペアが入った名前でも作成できるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外プロジェクト" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.project.name).toEqual("森鷗外プロジェクト");
    });

    it("descriptionなしでも作成できるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "説明なしプロジェクト" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.project.name).toEqual("説明なしプロジェクト");
    });
  });

  describe("PUT /api/projects/:id", () => {
    it("プロジェクトが更新できるんやで", async () => {
      const created = await projectStore.create({ name: "更新前" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "更新後", description: "新しい説明" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.project.name).toEqual("更新後");
      expect(json.project.description).toEqual("新しい説明");
    });

    it("statusも更新できるんやで", async () => {
      const created = await projectStore.create({ name: "ステータス更新" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.project.status).toEqual("completed");
    });

    it("無効なstatusやったら400返すねん", async () => {
      const created = await projectStore.create({ name: "不正ステータス" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid_status" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json.error).toEqual("Invalid status");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request(
        "/api/projects/00000000-0000-0000-0000-000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "存在せんやつ" }),
        }
      );
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json.error).toEqual("Project not found");
    });

    it("森鷗外の名前に更新できるんやで", async () => {
      const created = await projectStore.create({ name: "更新前" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外の作品集" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.project.name).toEqual("森鷗外の作品集");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("プロジェクトが削除できるんやで", async () => {
      const created = await projectStore.create({ name: "削除対象" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.message).toEqual("Project deleted");

      const check = await projectStore.getById(created.id);
      expect(check).toBeNull();
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request(
        "/api/projects/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" }
      );
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json.error).toEqual("Project not found");
    });
  });

  describe("GET /api/projects/:id/tasks", () => {
    it("プロジェクトに紐づくタスクが取得できるんやで", async () => {
      const project = await projectStore.create({ name: "タスク付きPJ" });
      await taskStore.create({ title: "タスク1", projectId: project.id });
      await taskStore.create({ title: "タスク2", projectId: project.id });
      await taskStore.create({ title: "別PJのタスク" });

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks.length).toEqual(2);
      expect(json.tasks.every((t: { projectId: string }) => t.projectId === project.id)).toEqual(true);
    });

    it("タスクがゼロ件でも空配列返すねん", async () => {
      const project = await projectStore.create({ name: "タスクなしPJ" });

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.tasks).toEqual([]);
    });

    it("存在しないプロジェクトIDやったら404返すねん", async () => {
      const res = await app.request(
        "/api/projects/00000000-0000-0000-0000-000000000000/tasks"
      );
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json.error).toEqual("Project not found");
    });
  });
});
