const { test, describe, before } = require("node:test");
const assert = require("node:assert");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

describe("SnapShare API Test Suite", () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "Password123!",
  };
  let authToken = "";
  let createdPostId = "";
  let createdCommentId = "";

  // 1. Health check
  test("GET /health returns 200 and status: ok", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
    assert.ok(data.timestamp);
  });

  // 2. Auth: User registration
  test("POST /auth/register creates a new user account", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.token, "Token should be issued");
    assert.strictEqual(data.user.username, testUser.username);
    authToken = data.token;
  });

  // 3. Auth: Duplicate username prevention
  test("POST /auth/register rejects duplicate username", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    assert.strictEqual(res.status, 409);
  });

  // 4. Auth: User login
  test("POST /auth/login returns JWT token with valid credentials", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.strictEqual(data.user.username, testUser.username);
  });

  // 5. Auth: Login fails with wrong password
  test("POST /auth/login rejects invalid password", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testUser.username, password: "WrongPassword" }),
    });
    assert.strictEqual(res.status, 401);
  });

  // 6. Auth: Current user verification
  test("GET /auth/me returns authenticated user with valid token", async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.username, testUser.username);
  });

  // 7. Posts: GET /posts returns posts and pagination
  test("GET /posts returns list of posts and pagination metadata", async () => {
    const res = await fetch(`${BASE_URL}/posts?page=1&limit=5`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.posts));
    assert.strictEqual(typeof data.total, "number");
    assert.strictEqual(data.page, 1);
  });

  // 8. Posts: Create post rejects unauthenticated request
  test("POST /create-post requires Authorization header", async () => {
    const res = await fetch(`${BASE_URL}/create-post`, {
      method: "POST",
    });
    assert.strictEqual(res.status, 401);
  });

  // 9. Stories: GET /stories returns stories list
  test("GET /stories returns active story candidates", async () => {
    const res = await fetch(`${BASE_URL}/stories`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.stories));
  });

  // 10. Trending tags
  test("GET /trending-tags returns array of tags", async () => {
    const res = await fetch(`${BASE_URL}/trending-tags`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.trending));
  });

  // 11. Notifications: Protected route check
  test("GET /notifications returns 401 without auth", async () => {
    const res = await fetch(`${BASE_URL}/notifications`);
    assert.strictEqual(res.status, 401);
  });

  // 12. Notifications: Authenticated fetch
  test("GET /notifications returns user notifications with auth", async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.notifications));
    assert.strictEqual(typeof data.unread, "number");
  });

  // 13. Post detail & view count increment
  test("GET /posts/:id returns post and increments view count", async () => {
    const listRes = await fetch(`${BASE_URL}/posts?limit=1`);
    const listData = await listRes.json();
    if (listData.posts && listData.posts.length > 0) {
      const postId = listData.posts[0]._id;
      const initialViews = listData.posts[0].views || 0;

      const singleRes = await fetch(`${BASE_URL}/posts/${postId}`);
      assert.strictEqual(singleRes.status, 200);
      const singleData = await singleRes.json();
      assert.ok(singleData.post);
      assert.strictEqual(singleData.post._id, postId);
      assert.ok(singleData.post.views >= initialViews);
    }
  });

  // 14. Like and unlike post
  test("PATCH /posts/:id/like toggles post likes", async () => {
    const listRes = await fetch(`${BASE_URL}/posts?limit=1`);
    const listData = await listRes.json();
    if (listData.posts && listData.posts.length > 0) {
      const postId = listData.posts[0]._id;
      const initialLikes = listData.posts[0].likes || 0;

      // Like
      const likeRes = await fetch(`${BASE_URL}/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: "like" }),
      });
      assert.strictEqual(likeRes.status, 200);
      const likeData = await likeRes.json();
      assert.strictEqual(likeData.likes, initialLikes + 1);

      // Unlike
      const unlikeRes = await fetch(`${BASE_URL}/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: "unlike" }),
      });
      assert.strictEqual(unlikeRes.status, 200);
      const unlikeData = await unlikeRes.json();
      assert.strictEqual(unlikeData.likes, initialLikes);
    }
  });

  // 15. Comments on a post
  test("POST /posts/:id/comments and GET /posts/:id/comments", async () => {
    const listRes = await fetch(`${BASE_URL}/posts?limit=1`);
    const listData = await listRes.json();
    if (listData.posts && listData.posts.length > 0) {
      const postId = listData.posts[0]._id;
      const commentText = `Awesome picture! ${Date.now()}`;

      // Create comment
      const createRes = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      assert.strictEqual(createRes.status, 201);
      const createData = await createRes.json();
      assert.strictEqual(createData.comment.text, commentText);
      assert.strictEqual(createData.comment.username, testUser.username);

      // Get comments
      const getRes = await fetch(`${BASE_URL}/posts/${postId}/comments`);
      assert.strictEqual(getRes.status, 200);
      const getData = await getRes.json();
      assert.ok(Array.isArray(getData.comments));
      const found = getData.comments.some((c) => c.text === commentText);
      assert.ok(found, "Newly added comment should be returned");
    }
  });

  // 16. Mark all notifications as read
  test("PATCH /notifications/mark-read updates read status", async () => {
    const res = await fetch(`${BASE_URL}/notifications/mark-read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
  });
});
