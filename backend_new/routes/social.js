// routes/social.js
const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");
const authenticateToken = require("../middlewares/auth");

/**
 * 44. GET /getUserInfo
 *     - Lấy thông tin user hiện tại (dựa vào JWT).
 */
router.get("/getUserInfo", authenticateToken, socialController.getUserInfo);

/**
 * 45. PUT /update-user
 *     - Cập nhật thông tin user (image, birthdate, tiktok_url, facebook_url, youtube_url).
 */
router.put("/update-user", authenticateToken, socialController.updateUser);

/**
 * 46. GET /getUserDetail/:userId
 *     - Lấy thông tin chi tiết của user khác, kèm trạng thái kết bạn giữa hai user.
 */
router.get(
  "/getUserDetail/:userId",
  authenticateToken,
  socialController.getUserDetail
);

/**
 * 47. POST /addFriend
 *     - Gửi lời mời kết bạn. Body: { friendId }.
 */
router.post("/addFriend", authenticateToken, socialController.addFriend);

/**
 * 48. POST /acceptFriend
 *     - Chấp nhận lời mời kết bạn. Body: { friendId }.
 */
router.post("/acceptFriend", authenticateToken, socialController.acceptFriend);

/**
 * 49. POST /rejectFriend
 *     - Từ chối lời mời kết bạn. Body: { friendId }.
 */
router.post("/rejectFriend", authenticateToken, socialController.rejectFriend);

/**
 * 50. GET /getFriends
 *     - Lấy danh sách bạn bè của user hiện tại.
 */
router.get("/getFriends", authenticateToken, socialController.getFriends);

/**
 * 51. POST /posts
 *     - Tạo bài viết (feed). Body: { title, content, image_url }.
 */
router.post("/posts", authenticateToken, socialController.createPost);

/**
 * 52. GET /posts
 *     - Lấy tất cả bài viết, kèm thông tin author, view_count, like_count, comment_count.
 */
router.get("/posts", authenticateToken, socialController.getPosts);

/**
 * 53. POST /posts/:post_id/view
 *     - Ghi nhận lượt xem cho bài viết. (Body: không cần, user từ JWT)
 */
router.post(
  "/posts/:post_id/view",
  authenticateToken,
  socialController.recordPostView
);

/**
 * 79. POST /followUser
 *     - Theo dõi một user (JWT required).
 */
router.post("/followUser", authenticateToken, socialController.followUser);

/**
 * 80. POST /unfollowUser
 *     - Bỏ theo dõi một user (JWT required).
 */
router.post("/unfollowUser", authenticateToken, socialController.unfollowUser);

/**
 * 81. GET /getFollowing
 *     - Lấy danh sách user mà current user đang follow (JWT required).
 */
router.get("/getFollowing", authenticateToken, socialController.getFollowing);

/**
 * 82. GET /getFollowers
 *     - Lấy danh sách user đang follow current user (JWT required).
 */
router.get("/getFollowers", authenticateToken, socialController.getFollowers);

/**
 * 82.5 POST /allUser
 *     - Tìm kiếm người dùng
 */
router.post("/allUser", socialController.allUser);

module.exports = router;
