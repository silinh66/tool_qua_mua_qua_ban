// routes/topics.js
const express = require("express");
const router = express.Router();
const topicsController = require("../controllers/topicsController");
const authenticateToken = require("../middlewares/auth"); // middleware JWT

/**
 * 14. GET /
 *     - Health-check: hello từ BCTC API Server
 */
router.get("/", topicsController.healthCheck);

/**
 * 15. GET /bctc/:symbol/:filename
 *     - Tải file BCTC (PDF) từ S3 (kí URL rồi redirect).
 *     - Middleware: checkS3Connection
 */
router.get("/bctc/:symbol/:filename", topicsController.downloadBCTC);

/**
 * 16. GET /financial-reports/:symbol
 *     - Liệt kê danh sách file báo cáo tài chính (.pdf) trên S3 cho symbol.
 *     - Middleware: checkS3Connection
 */
router.get("/financial-reports/:symbol", topicsController.listFinancialReports);

/**
 * 17. GET /getTopics/:symbol
 *     - Lấy danh sách topics (bài thảo luận) cho symbol, phân trang & sort.
 */
router.get("/getTopics/:symbol", topicsController.getTopicsBySymbol);

/**
 * 18. POST /followTopic
 *     - Theo dõi (follow) một topic. JWT required.
 */
router.post("/followTopic", authenticateToken, topicsController.followTopic);

/**
 * 19. POST /unfollowTopic
 *     - Bỏ theo dõi (unfollow) một topic. JWT required.
 */
router.post(
  "/unfollowTopic",
  authenticateToken,
  topicsController.unfollowTopic
);

/**
 * 20. GET /getFollowedTopics
 *     - Lấy danh sách topics mà user đang follow. JWT required.
 */
router.get(
  "/getFollowedTopics",
  authenticateToken,
  topicsController.getFollowedTopics
);

/**
 * 21. GET /getTopicsAll
 *     - Lấy tất cả topics (không theo symbol), phân trang & sortLike.
 */
router.get("/getTopicsAll", topicsController.getAllTopics);

/**
 * 22. GET /getTopicsByUser/:userId
 *     - Lấy tất cả topics do user (userId) đăng.
 */
router.get("/getTopicsByUser/:userId", topicsController.getTopicsByUser);

router.post("/createTopic", authenticateToken, topicsController.createTopic);

router.get("/topics/leaderboard", topicsController.getTopicsLeaderboard);

/**
 * 24. POST /topics/:topic_id/view
 *     - Record a view for a topic. JWT required.
 */
router.post("/topics/:topic_id/view", authenticateToken, topicsController.recordTopicView);

/**
 * 25. POST /topics/:topic_id/like
 *     - Like a topic. JWT required.
 */
router.post("/topics/:topic_id/like", authenticateToken, topicsController.likeTopic);

/**
 * 26. POST /topics/:topic_id/unlike
 *     - Unlike a topic. JWT required.
 */
router.post("/topics/:topic_id/unlike", authenticateToken, topicsController.unlikeTopic);

/**
 * 27. POST /topics/:topic_id/comments
 *     - Comment on a topic. JWT required.
 */
router.post("/topics/:topic_id/comments", authenticateToken, topicsController.createComment);

/**
 * 28. GET /topics/:topic_id/comments
 *     - Get all comments for a topic.
 */
router.get("/topics/:topic_id/comments", topicsController.getTopicComments);

/**
 * 29. GET /topics/:topic_id/likes
 *     - Get all likes for a topic.
 */
router.get("/topics/:topic_id/likes", topicsController.getTopicLikes);

module.exports = router;
