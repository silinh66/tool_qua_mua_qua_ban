// routes/postInteraction.js
const express = require("express");
const router = express.Router();
const postInteractionController = require("../controllers/postInteractionController");
const authenticateToken = require("../middlewares/auth");

/**
 * 54. POST /posts/:post_id/like
 *     - Like một bài viết feed (JWT required).
 */
router.post(
  "/posts/:post_id/like",
  authenticateToken,
  postInteractionController.likePost
);

/**
 * 55. POST /posts/:post_id/unlike
 *     - Unlike một bài viết feed (JWT required).
 */
router.post(
  "/posts/:post_id/unlike",
  authenticateToken,
  postInteractionController.unlikePost
);

/**
 * 56. POST /posts/:post_id/comments
 *     - Comment vào bài viết feed (JWT required).
 *     - Body: { content, parent_id? }
 */
router.post(
  "/posts/:post_id/comments",
  authenticateToken,
  postInteractionController.addPostComment
);

/**
 * 57. GET /posts/:post_id/comments
 *     - Lấy danh sách comment cho một bài viết feed (no auth needed).
 */
router.get(
  "/posts/:post_id/comments",
  postInteractionController.getPostComments
);

/**
 * 58. GET /posts/:post_id/likes
 *     - Lấy danh sách user đã like bài viết feed (no auth needed).
 */
router.get("/posts/:post_id/likes", postInteractionController.getPostLikes);

module.exports = router;
