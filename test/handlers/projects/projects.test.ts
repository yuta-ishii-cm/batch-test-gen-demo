// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { projectStore } from "../../../src/store/projectStore";
import { taskStore } from "../../../src/store/taskStore";
import { milestoneStore } from "../../../src/store/milestoneStore";

describe("Projects API", () => {
  beforeAll(() => {
    console.log("[START] Projects API");
  });

  afterAll(() => {
    console.log("[END] Projects API");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await milestoneStore.reset();
    await projectStore.reset();
  });

  describe("GET /api/projects", () => {
    beforeAll(() => {
      console.log("[START] GET /api/projects");
    });

    afterAll(() => {
      console.log("[END] GET /api/projects");
    });

    it("プロジェクト一覧が取得できるんやで", async () => {
      await projectStore.create({ name: "タスク管理システム" });
      await projectStore.create({ name: "在庫管理システム" });

      const res = await app.request("/api/projects");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.projects.length).toEqual(2);
    });

    it("プロジェクトが空でも正常に返すんやで", async () => {
      const res = await app.request("/api/projects");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.projects).toEqual([]);
    });

    it("ステータスでフィルターできるんやで", async () => {
      await projectStore.create({ name: "アクティブプロジェクト" });
      const archived = await projectStore.create({ name: "アーカイブ済み" });
      await projectStore.update(archived.id, { status: "archived" });

      const res = await app.request("/api/projects?status=archived");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.projects.length).toEqual(1);
      expect(body.projects[0].status).toEqual("archived");
    });

    it("存在しないステータスでフィルターしたら空配列が返るんやで", async () => {
      await projectStore.create({ name: "テストプロジェクト" });

      const res = await app.request("/api/projects?status=nonexistent");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.projects).toEqual([]);
    });
  });

  describe("GET /api/projects/:id", () => {
    beforeAll(() => {
      console.log("[START] GET /api/projects/:id");
    });

    afterAll(() => {
      console.log("[END] GET /api/projects/:id");
    });

    it("IDでプロジェクトが取得できるんやで", async () => {
      const created = await projectStore.create({ name: "顧客管理システム", description: "顧客情報を管理する" });

      const res = await app.request(`/api/projects/${created.id}`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.project.id).toEqual(created.id);
      expect(body.project.name).toEqual("顧客管理システム");
      expect(body.project.description).toEqual("顧客情報を管理する");
      expect(body.project.status).toEqual("active");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000");
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Project not found");
    });
  });

  describe("POST /api/projects", () => {
    beforeAll(() => {
      console.log("[START] POST /api/projects");
    });

    afterAll(() => {
      console.log("[END] POST /api/projects");
    });

    it("プロジェクトが正しく作成されるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新規プロジェクト", description: "テスト用" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.project.name).toEqual("新規プロジェクト");
      expect(body.project.description).toEqual("テスト用");
      expect(body.project.status).toEqual("active");
      expect(body.project.id).toBeDefined();
      expect(body.project.createdAt).toBeDefined();
      expect(body.project.updatedAt).toBeDefined();
    });

    it("descriptionなしでも作成できるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "名前だけプロジェクト" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.project.name).toEqual("名前だけプロジェクト");
      expect(body.project.description).toEqual("");
    });

    it("名前がないとバリデーションエラーで400になるっちゅうねん", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "名前なし" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Name is required");
    });

    it("名前が空文字でもバリデーションエラーになるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Name is required");
    });

    it("サロゲートペア文字「森鷗外」を含む名前でも正しく作成できるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外プロジェクト" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.project.name).toEqual("森鷗外プロジェクト");
    });

    it("特殊文字を含む名前でも正しく作成できるんやで", async () => {
      const res = await app.request("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "テスト<script>alert('xss')</script>" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.project.name).toEqual("テスト<script>alert('xss')</script>");
    });
  });

  describe("PUT /api/projects/:id", () => {
    beforeAll(() => {
      console.log("[START] PUT /api/projects/:id");
    });

    afterAll(() => {
      console.log("[END] PUT /api/projects/:id");
    });

    it("プロジェクト名を更新できるんやで", async () => {
      const created = await projectStore.create({ name: "旧名称" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新名称" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.project.name).toEqual("新名称");
    });

    it("ステータスを更新できるんやで", async () => {
      const created = await projectStore.create({ name: "ステータス変更テスト" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.project.status).toEqual("completed");
    });

    it("不正なステータスやったら400返すねん", async () => {
      const created = await projectStore.create({ name: "不正ステータステスト" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid_status" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Invalid status");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "存在しない" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Project not found");
    });

    it("サロゲートペア文字「森鷗外」を含む名前に更新できるんやで", async () => {
      const created = await projectStore.create({ name: "元の名前" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外記念館プロジェクト" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.project.name).toEqual("森鷗外記念館プロジェクト");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    beforeAll(() => {
      console.log("[START] DELETE /api/projects/:id");
    });

    afterAll(() => {
      console.log("[END] DELETE /api/projects/:id");
    });

    it("プロジェクトを削除できるんやで", async () => {
      const created = await projectStore.create({ name: "削除対象プロジェクト" });

      const res = await app.request(`/api/projects/${created.id}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.message).toEqual("Project deleted");

      const fetched = await projectStore.getById(created.id);
      expect(fetched).toBeNull();
    });

    it("プロジェクト削除でマイルストーンもカスケード削除されるんやで", async () => {
      const project = await projectStore.create({ name: "カスケード削除テスト" });
      await milestoneStore.create(project.id, { title: "マイルストーン1" });

      const res = await app.request(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      expect(res.status).toEqual(200);

      const remainingMilestones = await milestoneStore.getByProjectId(project.id);
      expect(remainingMilestones).toEqual([]);
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Project not found");
    });
  });

  describe("GET /api/projects/:id/tasks", () => {
    beforeAll(() => {
      console.log("[START] GET /api/projects/:id/tasks");
    });

    afterAll(() => {
      console.log("[END] GET /api/projects/:id/tasks");
    });

    it("プロジェクトに紐づくタスク一覧が取得できるんやで", async () => {
      const project = await projectStore.create({ name: "タスク付きプロジェクト" });
      await taskStore.create({ title: "マグロ", projectId: project.id });
      await taskStore.create({ title: "サーモン", projectId: project.id });

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tasks.length).toEqual(2);
      const titles = body.tasks.map((t: { title: string }) => t.title);
      expect(titles).toContain("マグロ");
      expect(titles).toContain("サーモン");
    });

    it("タスクがないプロジェクトでも空配列を返すんやで", async () => {
      const project = await projectStore.create({ name: "タスクなしプロジェクト" });

      const res = await app.request(`/api/projects/${project.id}/tasks`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tasks).toEqual([]);
    });

    it("他のプロジェクトのタスクは含まれへんねん", async () => {
      const project1 = await projectStore.create({ name: "プロジェクト1" });
      const project2 = await projectStore.create({ name: "プロジェクト2" });
      await taskStore.create({ title: "エビ", projectId: project1.id });
      await taskStore.create({ title: "イカ", projectId: project2.id });

      const res = await app.request(`/api/projects/${project1.id}/tasks`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tasks.length).toEqual(1);
      expect(body.tasks[0].title).toEqual("エビ");
    });

    it("存在しないプロジェクトIDやったら404返すねん", async () => {
      const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000/tasks");
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Project not found");
    });
  });
});
