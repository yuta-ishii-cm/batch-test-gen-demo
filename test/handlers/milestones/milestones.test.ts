// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { projectStore } from "../../../src/store/projectStore";

const BASE_URL = "http://localhost";
const JSON_HEADERS = { "Content-Type": "application/json" };
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * プロジェクトを作成し、そのIDを返すヘルパー
 * @param name - プロジェクト名
 * @returns 作成されたプロジェクトのID
 */
const createProject = async (name: string): Promise<string> => {
  const res = await app.request(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.project.id;
};

/**
 * マイルストーンを作成し、レスポンスを返すヘルパー
 * @param projectId - プロジェクトID
 * @param body - マイルストーンのリクエストボディ
 * @returns fetchレスポンス
 */
const createMilestone = async (projectId: string, body: Record<string, unknown>) => {
  return app.request(`${BASE_URL}/api/projects/${projectId}/milestones`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
};

/**
 * プロジェクトとマイルストーンを作成し、両方のIDを返すヘルパー
 * @param projectName - プロジェクト名
 * @param milestoneBody - マイルストーンのリクエストボディ
 * @returns プロジェクトIDとマイルストーンIDのタプル
 */
const createProjectAndMilestone = async (
  projectName: string,
  milestoneBody: Record<string, unknown>
): Promise<[string, string]> => {
  const projectId = await createProject(projectName);
  const res = await createMilestone(projectId, milestoneBody);
  const data = await res.json();
  return [projectId, data.milestone.id];
};

describe("マイルストーンハンドラー", () => {
  beforeAll(() => {
    console.log("[START] マイルストーンハンドラー");
  });

  afterAll(() => {
    console.log("[END] マイルストーンハンドラー");
  });

  beforeEach(async () => {
    await milestoneStore.reset();
    await projectStore.reset();
  });

  describe("GET /api/projects/:projectId/milestones", () => {
    beforeAll(() => {
      console.log("[START] GET /api/projects/:projectId/milestones");
    });

    afterAll(() => {
      console.log("[END] GET /api/projects/:projectId/milestones");
    });

    it("プロジェクトのマイルストーン一覧が取得できるんやで", async () => {
      const projectId = await createProject("マグロプロジェクト");
      await createMilestone(projectId, { title: "マグロ" });
      await createMilestone(projectId, { title: "サーモン" });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestones).toHaveLength(2);
    });

    it("マイルストーンが0件でも空配列が返るんやで", async () => {
      const projectId = await createProject("エビプロジェクト");

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestones).toEqual([]);
    });

    it("存在しないプロジェクトやったら404返すねん", async () => {
      const res = await app.request(
        `${BASE_URL}/api/projects/${FAKE_UUID}/milestones`
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Project not found");
    });
  });

  describe("GET /api/projects/:projectId/milestones/:milestoneId", () => {
    beforeAll(() => {
      console.log("[START] GET /api/projects/:projectId/milestones/:milestoneId");
    });

    afterAll(() => {
      console.log("[END] GET /api/projects/:projectId/milestones/:milestoneId");
    });

    it("IDを指定してマイルストーンが取得できるんやで", async () => {
      const [projectId, milestoneId] = await createProjectAndMilestone("イカプロジェクト", { title: "イカ" });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("イカ");
      expect(data.milestone.id).toEqual(milestoneId);
    });

    it("存在しないマイルストーンIDやったら404返すねん", async () => {
      const projectId = await createProject("タマゴプロジェクト");

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${FAKE_UUID}`
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("POST /api/projects/:projectId/milestones", () => {
    beforeAll(() => {
      console.log("[START] POST /api/projects/:projectId/milestones");
    });

    afterAll(() => {
      console.log("[END] POST /api/projects/:projectId/milestones");
    });

    it("マイルストーンが正しく作成されるんやで", async () => {
      const projectId = await createProject("ウニプロジェクト");

      const res = await createMilestone(projectId, {
        title: "ウニ",
        description: "最高級のウニマイルストーン",
        dueDate: "2026-12-31",
      });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("ウニ");
      expect(data.milestone.description).toEqual("最高級のウニマイルストーン");
      expect(data.milestone.dueDate).toEqual("2026-12-31");
      expect(data.milestone.status).toEqual("open");
      expect(data.milestone.projectId).toEqual(projectId);
    });

    it("タイトルだけでもマイルストーン作成できるんやで", async () => {
      const projectId = await createProject("イクラプロジェクト");

      const res = await createMilestone(projectId, { title: "イクラ" });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("イクラ");
      expect(data.milestone.description).toEqual("");
      expect(data.milestone.dueDate).toEqual(null);
    });

    it("タイトル無しやったら400返すっちゅうねん", async () => {
      const projectId = await createProject("アナゴプロジェクト");

      const res = await createMilestone(projectId, { description: "タイトル無し" });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Title is required");
    });

    it("存在しないプロジェクトにマイルストーン作ろうとしたら404やねん", async () => {
      const res = await createMilestone(FAKE_UUID, { title: "ホタテ" });
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Project not found");
    });
  });

  describe("PUT /api/projects/:projectId/milestones/:milestoneId", () => {
    beforeAll(() => {
      console.log("[START] PUT /api/projects/:projectId/milestones/:milestoneId");
    });

    afterAll(() => {
      console.log("[END] PUT /api/projects/:projectId/milestones/:milestoneId");
    });

    it("マイルストーンのタイトルが更新できるんやで", async () => {
      const [projectId, milestoneId] = await createProjectAndMilestone("カンパチプロジェクト", { title: "カンパチ" });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ title: "ブリ" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("ブリ");
    });

    it("マイルストーンのステータスをclosedに変更できるんやで", async () => {
      const [projectId, milestoneId] = await createProjectAndMilestone("マグロプロジェクト2", { title: "マグロ" });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ status: "closed" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.status).toEqual("closed");
    });

    it("無効なステータスやったら400返すっちゅうねん", async () => {
      const [projectId, milestoneId] = await createProjectAndMilestone("サーモンプロジェクト2", { title: "サーモン" });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ status: "invalid_status" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Invalid status");
    });

    it("存在しないマイルストーン更新しようとしたら404やねん", async () => {
      const projectId = await createProject("エビプロジェクト2");

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${FAKE_UUID}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ title: "更新したいエビ" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("DELETE /api/projects/:projectId/milestones/:milestoneId", () => {
    beforeAll(() => {
      console.log("[START] DELETE /api/projects/:projectId/milestones/:milestoneId");
    });

    afterAll(() => {
      console.log("[END] DELETE /api/projects/:projectId/milestones/:milestoneId");
    });

    it("マイルストーンが削除できるんやで", async () => {
      const [projectId, milestoneId] = await createProjectAndMilestone("ホタテプロジェクト", { title: "ホタテ" });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.message).toEqual("Milestone deleted");

      const getRes = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`
      );
      expect(getRes.status).toEqual(404);
    });

    it("存在しないマイルストーン削除しようとしたら404やねん", async () => {
      const projectId = await createProject("タマゴプロジェクト2");

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${FAKE_UUID}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("境界値テスト", () => {
    beforeAll(() => {
      console.log("[START] 境界値テスト");
    });

    afterAll(() => {
      console.log("[END] 境界値テスト");
    });

    it("サロゲートペア文字「森鷗外」を含むタイトルで作成できるんやで", async () => {
      const projectId = await createProject("森鷗外プロジェクト");
      const res = await createMilestone(projectId, { title: "森鷗外" });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("森鷗外");
    });

    it("空文字のタイトルやったら400返すねん", async () => {
      const projectId = await createProject("空文字テストプロジェクト");
      const res = await createMilestone(projectId, { title: "" });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Title is required");
    });

    it("dueDateのフォーマットがそのまま保存されるんやで", async () => {
      const projectId = await createProject("日付テストプロジェクト");
      const res = await createMilestone(projectId, {
        title: "アナゴ",
        dueDate: "2026-01-01",
      });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.dueDate).toEqual("2026-01-01");
    });

    it("dueDateをnullで更新できるんやで", async () => {
      const [projectId, milestoneId] = await createProjectAndMilestone("null日付プロジェクト", {
        title: "エビ",
        dueDate: "2026-06-15",
      });

      const res = await app.request(
        `${BASE_URL}/api/projects/${projectId}/milestones/${milestoneId}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ dueDate: null }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.dueDate).toEqual(null);
    });
  });
});
