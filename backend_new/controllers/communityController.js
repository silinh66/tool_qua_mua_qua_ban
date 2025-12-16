// controllers/communityController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 64. POST /forums/:forum_id/posts/:post_id/like
 */
exports.likeForumPost = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO forum_post_likes (post_id, userId) VALUES (?, ?)";
    await queryMySQL(sql, [post_id, userId]);
    res.json({ success: true, message: "Post liked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 65. POST /forums/:forum_id/posts/:post_id/comments
 */
exports.addForumPostComment = async (req, res, next) => {
  try {
    const forum_id = parseInt(req.params.forum_id);
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;
    const { content, parent_id } = req.body; // Nhận trường parent_id

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = { post_id, userId, content, parent_id };
    const sql = "INSERT INTO forum_post_comments SET ?";
    await queryMySQL(sql, comment);
    res.json({ success: true, message: "Comment created" });
  } catch (err) {
    next(err);
  }
};

/**
 * 66. POST /comments/:topic_id/:comment_id/like
 */
exports.likeTopicComment = async (req, res, next) => {
  try {
    const comment_id = parseInt(req.params.comment_id);

    const topic_id = parseInt(req.params.topic_id);
    const userId = req.user ? req.user.userId : null;

    const sql =
      "INSERT INTO likes_comment (comment_id, topic_id, userId) VALUES (?, ?, ?)";
    await queryMySQL(sql, [comment_id, topic_id, userId]);
    res.json({ success: true, message: "Comment liked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 67. POST /comments/:topic_id/:comment_id/unlike
 */
exports.unlikeTopicComment = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);
    const comment_id = parseInt(req.params.comment_id);
    const userId = req.user ? req.user.userId : null;

    const sql = "DELETE FROM likes_comment WHERE comment_id = ? AND userId = ?";
    await queryMySQL(sql, [comment_id, userId]);
    res.json({ success: true, message: "Comment unliked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 68. GET /forums/posts/:post_id/comments
 */
exports.getForumPostComments = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const sql = `
      SELECT c.*, u.name, u.image as avatar
      FROM forum_post_comments c
      JOIN users u ON c.userId = u.userId
      WHERE c.post_id = ?`;
    let comments = await queryMySQL(sql, [post_id]);
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

/**
 * 69. GET /forums/posts/:post_id/likes
 */
exports.getForumPostLikes = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const sql = `
      SELECT l.*, u.name, u.image as avatar
      FROM forum_post_likes l
      JOIN users u ON l.userId = u.userId
      WHERE l.post_id = ?`;
    let likes = await queryMySQL(sql, [post_id]);
    res.json({ success: true, likes });
  } catch (err) {
    next(err);
  }
};

/**
 * 70. GET /user-info
 *    - Query: userId
 *    - Lấy thông tin user và followerCount.
 *    - JWT optional, nhưng nếu không có token vẫn trả info & followerCount.
 */
exports.getUserInfoById = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    let userResult = await queryMySQL(
      "SELECT userID, email, phone_number, name, createdOn, image as avatar, isOnline FROM users WHERE userID = ?",
      [userId]
    );
    if (userResult.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    let followersResult = await queryMySQL(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [userId]
    );

    let userInfo = userResult[0];
    userInfo.followerCount = followersResult[0].followerCount;

    res.send(userInfo);
  } catch (err) {
    next(err);
  }
};

/**
 * 71. GET /featured-posts
 *    - Lấy 20 forum posts có số view_count cao nhất.
 */
exports.getFeaturedPosts = async (req, res, next) => {
  try {
    const sql = `
    SELECT 
      fp.forum_post_id, 
      fp.forum_id, -- Thêm dòng này để lấy forum_id
      fp.title, 
      fp.content, 
      fp.image_url, 
      fp.created_at, 
      fp.updated_at, 
      u.name as author, 
      u.image,
      (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
      (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
      (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId
    ORDER BY view_count DESC
    LIMIT 20`;
    let posts = await queryMySQL(sql);
    for (let post of posts) {
      const likesSql = `
        SELECT ul.userId, u.name, u.image as avatar
        FROM forum_post_likes ul
        JOIN users u ON ul.userId = u.userId
        WHERE ul.post_id = ?`;
      let likes = await queryMySQL(likesSql, [post.forum_post_id]);
      post.likes = likes; // Adding user details to each post
    }
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

/**
 * 72. GET /featured-post-detail/:post_id
 *    - Lấy chi tiết một featured post, kèm likes + comments.
 */
exports.getFeaturedPostDetail = async (req, res, next) => {
  try {
    const { post_id } = req.params;

    const sql = `
    SELECT 
      fp.forum_post_id, 
      fp.title, 
      fp.content, 
      fp.image_url, 
      fp.created_at, 
      fp.updated_at, 
      u.name as author, 
      u.image as author_image,
      (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
      (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
      (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId
    WHERE fp.forum_post_id = ?
    LIMIT 1`;
    const [post] = await queryMySQL(sql, [post_id]);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Fetch likes details
    const likesSql = `
      SELECT u.userID, u.name, u.image as avatar
      FROM forum_post_likes fpl
      JOIN users u ON fpl.userId = u.userID
      WHERE fpl.post_id = ?`;
    const likes = await queryMySQL(likesSql, [post_id]);
    post.likes = likes;

    // Fetch comments details
    const commentsSql = `
      SELECT c.comment_id, c.content, c.created_at, u.userID, u.name, u.image as avatar
      FROM forum_post_comments c
      JOIN users u ON c.userId = u.userID
      WHERE c.post_id = ?`;
    const comments = await queryMySQL(commentsSql, [post_id]);
    post.comments = comments;

    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

/**
 * 73. POST /forums/:forum_id/follow
 *    - Follow một forum (JWT required).
 */
exports.followForum = async (req, res, next) => {
  try {
    const forum_id = parseInt(req.params.forum_id);
    const userId = req.user.userId;

    const follow = { forum_id, userId };
    const sql = "INSERT INTO forum_followers SET ?";
    await queryMySQL(sql, follow);

    res.json({ success: true, message: "Forum followed" });
  } catch (err) {
    next(err);
  }
};
