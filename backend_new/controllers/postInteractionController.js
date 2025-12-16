// controllers/postInteractionController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 54. POST /posts/:post_id/like
 *    - Insert vào bảng likes (post_id, user_id, created_at).
 */
exports.likePost = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO likes (post_id, userId) VALUES (?, ?)";
    await queryMySQL(sql, [post_id, userId]);
    res.json({ success: true, message: "Post liked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 55. POST /posts/:post_id/unlike
 *    - Xóa khỏi likes (post_id, user_id).
 */
exports.unlikePost = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    const sql = "DELETE FROM likes WHERE post_id = ? AND userId = ?";

    await queryMySQL(sql, [post_id, userId]);
    res.json({ success: true, message: "Post unliked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 56. POST /posts/:post_id/comments
 *    - Thêm comment cho bài viết feed.
 *    - Body: { content, parent_id? }
 */
exports.addPostComment = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;
    const { content, parent_id } = req.body; // Thêm trường parent_id

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = { post_id, userId, content, parent_id };
    const sql = "INSERT INTO comments SET ?";
    await queryMySQL(sql, comment);
    res.json({ success: true, message: "Comment created" });
  } catch (err) {
    next(err);
  }
};

/**
 * 57. GET /posts/:post_id/comments
 *    - Lấy tất cả comment cho bài viết feed, kèm thông tin user (name, avatar).
 */
exports.getPostComments = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const sql = `
    SELECT comments.*, users.name, users.image as avatar
    FROM comments
    JOIN users ON comments.userId = users.userId
    WHERE comments.post_id = ?`;
    let comments = await queryMySQL(sql, [post_id]);
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

/**
 * 58. GET /posts/:post_id/likes
 *    - Lấy tất cả user đã like bài viết feed, kèm name + avatar.
 */
exports.getPostLikes = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const sql = `
    SELECT likes.*, users.name, users.image as avatar
    FROM likes
    JOIN users ON likes.userId = users.userId
    WHERE likes.post_id = ?`;
    let likes = await queryMySQL(sql, [post_id]);
    res.json({ success: true, likes });
  } catch (err) {
    next(err);
  }
};
