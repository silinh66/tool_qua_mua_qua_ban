// routes/community.js
const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const authenticateToken = require("../middlewares/auth");

/**
 * 64. POST /forums/:forum_id/posts/:post_id/like
 *     - Like một forum post (JWT required).
 */
router.post(
  "/forums/:forum_id/posts/:post_id/like",
  authenticateToken,
  communityController.likeForumPost
);

/**
 * 65. POST /forums/:forum_id/posts/:post_id/comments
 *     - Comment vào một forum post (JWT required).
 *     - Body: { content, parent_id? }
 */
router.post(
  "/forums/:forum_id/posts/:post_id/comments",
  authenticateToken,
  communityController.addForumPostComment
);

/**
 * 66. POST /comments/:topic_id/:comment_id/like
 *     - Like một comment (thuộc topic) (JWT required).
 */
router.post(
  "/comments/:topic_id/:comment_id/like",
  authenticateToken,
  communityController.likeTopicComment
);

/**
 * 67. POST /comments/:topic_id/:comment_id/unlike
 *     - Unlike một comment (thuộc topic) (JWT required).
 */
router.post(
  "/comments/:topic_id/:comment_id/unlike",
  authenticateToken,
  communityController.unlikeTopicComment
);

/**
 * 68. GET /forums/posts/:post_id/comments
 *     - Lấy comment cho forum post (no auth needed).
 */
router.get(
  "/forums/posts/:post_id/comments",
  communityController.getForumPostComments
);

/**
 * 69. GET /forums/posts/:post_id/likes
 *     - Lấy likes cho forum post (no auth needed).
 */
router.get(
  "/forums/posts/:post_id/likes",
  communityController.getForumPostLikes
);

/**
 * 70. GET /user-info
 *     - Lấy thông tin user dựa vào query param userId, JWT optional.
 *     - Query: userId
 */
router.get("/user-info", communityController.getUserInfoById);

/**
 * 71. GET /featured-posts
 *     - Lấy 20 forum posts nổi bật (theo view_count) (no auth).
 */
router.get("/featured-posts", communityController.getFeaturedPosts);

/**
 * 72. GET /featured-post-detail/:post_id
 *     - Lấy chi tiết một featured post, kèm likes + comments (no auth).
 */
router.get(
  "/featured-post-detail/:post_id",
  communityController.getFeaturedPostDetail
);

/**
 * 73. POST /forums/:forum_id/follow
 *     - Follow một forum (JWT required).
 */
router.post(
  "/forums/:forum_id/follow",
  authenticateToken,
  communityController.followForum
);

module.exports = router;
