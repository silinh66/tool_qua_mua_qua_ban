// routes/forum.js
const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forumController");
const authenticateToken = require("../middlewares/auth");

/**
 * 59. POST /forums
 *     - Tạo một forum mới.
 *     - Body: { name, image_url, description } (JWT required).
 */
router.post("/forums", authenticateToken, forumController.createForum);

/**
 * 60. GET /forums
 *     - Lấy danh sách tất cả forum, kèm số bài viết (post_count).
 */
router.get("/forums", forumController.getForums);

/**
 * 61. POST /forums/:forum_id/posts
 *     - Tạo bài viết (forum post) trong forum cụ thể.
 *     - Body: { title, content, image_url } (JWT required).
 */
router.post(
  "/forums/:forum_id/posts",
  authenticateToken,
  forumController.createForumPost
);

/**
 * 62. GET /forums/:forum_id/posts
 *     - Lấy danh sách bài viết trong forum, kèm author info, view_count, like_count, comment_count.
 */
router.get("/forums/:forum_id/posts", forumController.getForumPosts);

/**
 * 63. POST /forums/:forum_id/posts/:post_id/view
 *     - Ghi nhận lượt xem cho một forum post (JWT required).
 */
router.post(
  "/forums/:forum_id/posts/:post_id/view",
  authenticateToken,
  forumController.recordForumPostView
);

/**
 * 74. GET /forums/:forum_id/followers
 *     - Lấy danh sách user đang follow forum (no auth needed).
 */
router.get("/forums/:forum_id/followers", forumController.getForumFollowers);

/**
 * 75. GET /forums/following
 *     - Lấy danh sách forum mà user đang follow (JWT required).
 */
router.get(
  "/forums/following",
  authenticateToken,
  forumController.getFollowingForums
);

/**
 * 76. GET /posts/following
 *     - Lấy danh sách post của các user mà current user đang follow (JWT required).
 */
router.get(
  "/posts/following",
  authenticateToken,
  forumController.getPostsFromFollowedUsers
);

/**
 * 77. POST /forums/:forum_id/unfollow
 *     - Bỏ follow một forum (JWT required).
 */
router.post(
  "/forums/:forum_id/unfollow",
  authenticateToken,
  forumController.unfollowForum
);

/**
 * 78. GET /forums/posts/all
 *     - Lấy tất cả forum posts bất kể forum (no auth).
 */
router.get("/forums/posts/all", forumController.getAllForumPosts);

module.exports = router;
