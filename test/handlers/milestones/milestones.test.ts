// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { projectStore } from "../../../src/store/projectStore";

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";
const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * プロジェクトを作成するヘルパー
 * @param name - プロジェクト名
 * @returns 作成されたプロジェクトのレスポンスBody
 */
const createProject = async (name: string) => {
  const res = await app.request("/api/projects", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.project;
};

/**
 * マイルストーンを作成するヘルパー
 * @param projectId - プロジェクトID
 * @param body - マイルストーン作成リクエストボディ
 * @returns レスポンスオブジェクト
 */
const createMilestone = async (
  projectId: string,
  body: Record<string, unknown>
) => {
  return app.request(`/api/projects/${projectId}/milestones`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
};

describe("milestones handlers", () => {
  let projectId: string;

  beforeAll(() => {
    console.log("[START] milestones handlers");
  });

  afterAll(() => {
    console.log("[END] milestones handlers");
  });

  beforeEach(async () => {
    await milestoneStore.reset();
    await projectStore.reset();
    const project = await createProject("マグロプロジェクト");
    projectId = project.id;
  });

  describe("GET /api/projects/:projectId/milestones", () => {
    it("プロジェクトのマイルストーン一覧が取得できるんやで", async () => {
      await createMilestone(projectId, { title: "サーモン" });
      await createMilestone(projectId, { title: "エビ" });

      const res = await app.request(
        `/api/projects/${projectId}/milestones`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestones.length).toEqual(2);
    });

    it("マイルストーンが無かったら空配列返すんやで", async () => {
      const res = await app.request(
        `/api/projects/${projectId}/milestones`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestones).toEqual([]);
    });

    it("存在しないプロジェクトやったら404返すねん", async () => {
      const res = await app.request(
        `/api/projects/${NON_EXISTENT_UUID}/milestones`
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Project not found");
    });
  });

  describe("POST /api/projects/:projectId/milestones", () => {
    it("マイルストーンが正しく作成されるんやで", async () => {
      const res = await createMilestone(projectId, {
        title: "イカ",
        description: "イカしたマイルストーンやで",
        dueDate: "2026-06-30",
      });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("イカ");
      expect(data.milestone.description).toEqual("イカしたマイルストーンやで");
      expect(data.milestone.dueDate).toEqual("2026-06-30");
      expect(data.milestone.status).toEqual("open");
      expect(data.milestone.projectId).toEqual(projectId);
    });

    it("タイトルだけでも作成できるんやで", async () => {
      const res = await createMilestone(projectId, { title: "タマゴ" });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("タマゴ");
      expect(data.milestone.description).toEqual("");
      expect(data.milestone.dueDate).toEqual(null);
    });

    it("タイトル無しやったら400返すっちゅうねん", async () => {
      const res = await createMilestone(projectId, {
        description: "タイトル忘れてもうた",
      });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Title is required");
    });

    it("存在しないプロジェクトに作ろうとしたら404やねん", async () => {
      const res = await createMilestone(NON_EXISTENT_UUID, {
        title: "ウニ",
      });
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Project not found");
    });
  });

  describe("GET /api/projects/:projectId/milestones/:milestoneId", () => {
    it("IDでマイルストーン取得できるんやで", async () => {
      const createRes = await createMilestone(projectId, { title: "イクラ" });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("イクラ");
      expect(data.milestone.id).toEqual(created.milestone.id);
    });

    it("存在しないマイルストーンIDやったら404やねん", async () => {
      const res = await app.request(
        `/api/projects/${projectId}/milestones/${NON_EXISTENT_UUID}`
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("PUT /api/projects/:projectId/milestones/:milestoneId", () => {
    it("マイルストーンのタイトル更新できるんやで", async () => {
      const createRes = await createMilestone(projectId, { title: "アナゴ" });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ title: "ホタテ" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("ホタテ");
    });

    it("openからclosedにステータス変えられるんやで", async () => {
      const createRes = await createMilestone(projectId, {
        title: "カンパチ",
      });
      const created = await createRes.json();
      expect(created.milestone.status).toEqual("open");

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
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

    it("不正なステータスやったら400返すで", async () => {
      const createRes = await createMilestone(projectId, {
        title: "サーモン",
      });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
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
      const res = await app.request(
        `/api/projects/${projectId}/milestones/${NON_EXISTENT_UUID}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ title: "エビ" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });

    it("dueDateも更新できるんやで", async () => {
      const createRes = await createMilestone(projectId, {
        title: "ウニ",
        dueDate: "2026-06-30",
      });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ dueDate: "2026-12-31" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.dueDate).toEqual("2026-12-31");
    });
  });

  describe("DELETE /api/projects/:projectId/milestones/:milestoneId", () => {
    it("マイルストーン削除できるんやで", async () => {
      const createRes = await createMilestone(projectId, {
        title: "マグロ",
      });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.message).toEqual("Milestone deleted");

      const getRes = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`
      );
      expect(getRes.status).toEqual(404);
    });

    it("存在しないマイルストーン削除しようとしたら404やねん", async () => {
      const res = await app.request(
        `/api/projects/${projectId}/milestones/${NON_EXISTENT_UUID}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("境界値テスト", () => {
    it("サロゲートペア文字（森鷗外）を含むタイトルでも作成できるんやで", async () => {
      const res = await createMilestone(projectId, { title: "森鷗外" });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("森鷗外");
    });

    it("サロゲートペア文字（森鷗外）を含む説明文でも更新できるんやで", async () => {
      const createRes = await createMilestone(projectId, {
        title: "テスト",
      });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ description: "森鷗外の作品リスト" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.description).toEqual("森鷗外の作品リスト");
    });

    it("空文字タイトルやったら400になるんやで", async () => {
      const res = await createMilestone(projectId, { title: "" });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Title is required");
    });

    it("dueDateがnullでも更新できるんやで", async () => {
      const createRes = await createMilestone(projectId, {
        title: "ホタテ",
        dueDate: "2026-06-30",
      });
      const created = await createRes.json();

      const res = await app.request(
        `/api/projects/${projectId}/milestones/${created.milestone.id}`,
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
