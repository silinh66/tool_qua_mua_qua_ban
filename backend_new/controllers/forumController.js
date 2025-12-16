// controllers/forumController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 59. POST /forums
 *    - Body: { name, image_url, description }.
 */
exports.createForum = async (req, res, next) => {
  try {
    const { name, image_url, description } = req.body;
    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }
    const forum = { name, image_url, description };
    const sql = "INSERT INTO forums SET ?";
    await queryMySQL(sql, forum);
    res.json({ success: true, message: "Forum created" });
  } catch (err) {
    next(err);
  }
};

/**
 * 60. GET /forums
 *    - Lấy tất cả forum, kèm số bài viết (post_count).
 */
exports.getForums = async (req, res, next) => {
  try {
    const sql = `
    SELECT f.forum_id, f.name, f.image_url, f.description, 
           (SELECT COUNT(*) FROM forum_posts WHERE forum_id = f.forum_id) as post_count
    FROM forums f`;
    let forums = await queryMySQL(sql);
    res.json({ success: true, forums });
  } catch (err) {
    next(err);
  }
};

/**
 * 61. POST /forums/:forum_id/posts
 *    - Body: { title, content, image_url }.
 */
exports.createForumPost = async (req, res, next) => {
  try {
    const forum_id = parseInt(req.params.forum_id);
    const { title, content, image_url } = req.body;
    const userId = req.user.userId;
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const forumPost = { forum_id, userId, title, content, image_url };
    const forumPostSql = "INSERT INTO forum_posts SET ?";
    await queryMySQL(forumPostSql, forumPost);

    res.json({ success: true, message: "Forum post created" });
  } catch (err) {
    next(err);
  }
};

/**
 * 62. GET /forums/:forum_id/posts
 *    - Lấy danh sách forum posts trong forum, kèm author info, view_count, like_count, comment_count.
 */
exports.getForumPosts = async (req, res, next) => {
  try {
    const forum_id = parseInt(req.params.forum_id);

    const sql = `
      SELECT fp.forum_post_id, fp.title, fp.content, fp.image_url, fp.created_at, fp.updated_at, 
             u.name as author, u.image,
             (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
             (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
             (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
      FROM forum_posts fp
      JOIN users u ON fp.userId = u.userId
      WHERE fp.forum_id = ?`;
    let posts = await queryMySQL(sql, [forum_id]);

    // Lấy danh sách người like cho mỗi bài viết
    for (let post of posts) {
      const likesSql = `
          SELECT u.userId, u.name, u.image
          FROM forum_post_likes fpl
          JOIN users u ON fpl.userId = u.userId
          WHERE fpl.post_id = ?`;
      let likes = await queryMySQL(likesSql, [post.forum_post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

/**
 * 63. POST /forums/:forum_id/posts/:post_id/view
 *    - Ghi nhận lượt xem cho một forum post.
 */
exports.recordForumPostView = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO forum_post_views (post_id, userId) VALUES (?, ?)";
    await queryMySQL(sql, [post_id, userId]);

    res.json({ success: true, message: "View recorded" });
  } catch (err) {
    next(err);
  }
};

/**
 * 74. GET /forums/:forum_id/followers
 *    - Lấy danh sách user đang follow forum.
 */
exports.getForumFollowers = async (req, res, next) => {
  try {
    const forum_id = parseInt(req.params.forum_id);

    const sql = `
    SELECT u.userId, u.name, u.image
    FROM forum_followers ff
    JOIN users u ON ff.userId = u.userId
    WHERE ff.forum_id = ?`;
    let followers = await queryMySQL(sql, [forum_id]);
    res.json({ success: true, followers });
  } catch (err) {
    next(err);
  }
};

/**
 * 75. GET /forums/following
 *    - Lấy danh sách forum mà user đang follow.
 */
exports.getFollowingForums = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const forums = await queryMySQL(
      "SELECT f.forum_id, f.name, f.image_url, f.description, " +
        "(SELECT COUNT(*) FROM forum_posts WHERE forum_id = f.forum_id) as post_count " +
        "FROM forums f " +
        "JOIN forum_followers ff ON f.forum_id = ff.forum_id " +
        "WHERE ff.userId = ?",
      [userId]
    );
    res.json({ success: true, forums });
  } catch (err) {
    next(err);
  }
};

/**
 * 76. GET /posts/following
 *    - Lấy danh sách post của các user mà current user đang follow.
 */
exports.getPostsFromFollowedUsers = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const postsSql = `
    SELECT p.*, u.name as author, u.image as avatar, 
           (SELECT COUNT(*) FROM views WHERE views.post_id = p.post_id) as view_count,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = p.post_id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE comments.post_id = p.post_id) as comment_count
    FROM posts p
    JOIN users u ON p.userId = u.userId
    WHERE p.userId IN (SELECT following_id FROM user_followers WHERE follower_id = ?)`;
    let posts = await queryMySQL(postsSql, [userId]);

    // Lấy danh sách người like cho mỗi bài viết
    for (let post of posts) {
      const likesSql = `
        SELECT u.userId, u.name, u.image as avatar
        FROM likes
        JOIN users u ON likes.userId = u.userId
        WHERE likes.post_id = ?`;
      let likes = await queryMySQL(likesSql, [post.post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

/**
 * 77. POST /forums/:forum_id/unfollow
 */
exports.unfollowForum = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const forum_id = req.params.forum_id;
    await queryMySQL(
      "DELETE FROM forum_followers WHERE forum_id = ? AND userId = ?",
      [forum_id, userId]
    );
    res.json({ success: true, message: "Unfollowed forum successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 78. GET /forums/posts/all
 *    - Lấy tất cả forum posts, kèm author info + số liệu view, like, comment.
 */
exports.getAllForumPosts = async (req, res, next) => {
  try {
    const sql = `
    SELECT fp.forum_post_id, fp.title, fp.content, fp.image_url, fp.created_at, fp.updated_at, 
           u.name as author, u.image,
           (SELECT COUNT(*) FROM forum_post_views WHERE post_id = fp.forum_post_id) as view_count,
           (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = fp.forum_post_id) as like_count,
           (SELECT COUNT(*) FROM forum_post_comments WHERE post_id = fp.forum_post_id) as comment_count
    FROM forum_posts fp
    JOIN users u ON fp.userId = u.userId`;
    let posts = await queryMySQL(sql);

    // Lấy danh sách người like cho mỗi bài viết
    for (let post of posts) {
      const likesSql = `
        SELECT u.userId, u.name, u.image
        FROM forum_post_likes fpl
        JOIN users u ON fpl.userId = u.userId
        WHERE fpl.post_id = ?`;
      let likes = await queryMySQL(likesSql, [post.forum_post_id]);
      post.likes = likes;
    }

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};
