// controllers/socialController.js
const queryMySQL = require("../utils/queryMySQL");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * 44. GET /getUserInfo
 *    - Lấy thông tin user hiện tại (req.user.userId từ middleware).
 *    - Trả về: { userID, email, phone_number, name, createdOn, avatar, isOnline, birthdate, tiktok_url, facebook_url, youtube_url, followerCount }.
 */
exports.getUserInfo = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    let userResult = await queryMySQL(
      "SELECT userID, email, phone_number, name, createdOn, image as avatar, isOnline, birthdate, tiktok_url , facebook_url , youtube_url  FROM users WHERE userID = ?",
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
 * 45. PUT /update-user
 *    - Body: { image, birthdate (YYYY-MM-DD), tiktok_url, facebook_url, youtube_url }.
 *    - Cập nhật rồi trả về thông tin user mới kèm followerCount.
 */
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { image, birthdate, tiktok_url, facebook_url, youtube_url } =
      req.body;
    // Validate birthdate
    const validDate = moment(birthdate, "YYYY-MM-DD", true).isValid(); // Strict parsing to ensure format
    if (!validDate) {
      return res.status(400).send({ error: "Invalid birthdate format" });
    }
    const userExists = await queryMySQL(
      "SELECT 1 FROM users WHERE userID = ?",
      [userId]
    );
    if (userExists.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    // Proceed with update if date is valid
    await queryMySQL(
      `UPDATE users SET image = ?, birthdate = ?, tiktok_url = ?, facebook_url = ?, youtube_url = ? WHERE userID = ?`,
      [image, birthdate, tiktok_url, facebook_url, youtube_url, userId]
    );

    const updatedUserResult = await queryMySQL(
      "SELECT userID, email, phone_number, name, createdOn, image, birthdate, tiktok_url, facebook_url, youtube_url, isOnline FROM users WHERE userID = ?",
      [userId]
    );

    let userInfo = updatedUserResult[0];
    let followersResult = await queryMySQL(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [userId]
    );
    userInfo.followerCount = followersResult[0].followerCount;

    res.send(userInfo);
  } catch (err) {
    next(err);
  }
};

/**
 * 46. GET /getUserDetail/:userId
 *    - Lấy thông tin user với param userId, kèm status mối quan hệ: 'pending', 'accepted', 'not'.
 */
exports.getUserDetail = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId; // The user whose details are being fetched
    const currentUserId = req.user ? req.user.userId : null; // The authenticated user

    // Fetch user details
    let userResult = await queryMySQL(
      "SELECT userID, email, phone_number, name, createdOn, image as avatar, isOnline FROM users WHERE userID = ?",
      [targetUserId]
    );

    if (userResult.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    let userInfo = userResult[0];

    // Fetch follower count
    let followersResult = await queryMySQL(
      "SELECT COUNT(*) as followerCount FROM user_followers WHERE following_id = ?",
      [targetUserId]
    );
    userInfo.followerCount = followersResult[0].followerCount;

    // Initialize status as 'not' by default
    let status = "not";

    if (currentUserId) {
      // Check if there is a friendship record where currentUserId sent a request to targetUserId
      let sentRequest = await queryMySQL(
        "SELECT status FROM friendships WHERE user1_id = ? AND user2_id = ?",
        [currentUserId, targetUserId]
      );

      let receivedRequest = await queryMySQL(
        "SELECT status FROM friendships WHERE user1_id = ? AND user2_id = ?",
        [targetUserId, currentUserId]
      );

      if (sentRequest.length > 0) {
        if (sentRequest[0].status === "requested") {
          status = "pending_sent"; // Người dùng hiện tại đã gửi lời mời kết bạn
        } else if (sentRequest[0].status === "accepted") {
          status = "acceptFriend"; // Hai người đã là bạn (trước đây là "done")
        }
      } else if (receivedRequest.length > 0) {
        if (receivedRequest[0].status === "requested") {
          status = "pending_received"; // Người kia đã gửi lời mời kết bạn
        } else if (receivedRequest[0].status === "accepted") {
          status = "acceptFriend"; // Hai người đã là bạn (trước đây là "done")
        }
      }
    }

    // Add the status to the userInfo
    userInfo.status = status;

    res.send(userInfo);
  } catch (err) {
    next(err);
  }
};

/**
 * 47. POST /addFriend
 *    - Body: { friendId }.
 *    - Tạo record trong friendships: (user1_id=current, user2_id=friendId, status='requested', action_user_id=current).
 */
exports.addFriend = async (req, res, next) => {
  try {
    const friendId = req.body.friendId;
    const userId = req.user.userId; // Extracted from JWT
    await queryMySQL(
      "INSERT INTO friendships (user1_id, user2_id, status, action_user_id) VALUES (?, ?, 'requested', ?)",
      [userId, friendId, userId]
    );
    res.json({ success: true, message: "Friend request sent" });
  } catch (err) {
    next(err);
  }
};

/**
 * 48. POST /acceptFriend
 *    - Body: { friendId }.
 *    - Cập nhật friendships.status = 'accepted', đồng thời thêm hai record vào user_followers.
 */
exports.acceptFriend = async (req, res, next) => {
  try {
    const friendId = req.body.friendId;
    const userId = req.user.userId;
    await queryMySQL(
      "UPDATE friendships SET status = 'accepted', action_user_id = ? WHERE user1_id = ? AND user2_id = ? AND status = 'requested'",
      [userId, friendId, userId]
    );

    // Tự động theo dõi lẫn nhau
    await queryMySQL(
      "INSERT INTO user_followers (follower_id, following_id) VALUES (?, ?), (?, ?)",
      [userId, friendId, friendId, userId]
    );
    res.json({ success: true, message: "Friend request accepted" });
  } catch (err) {
    next(err);
  }
};

/**
 * 49. POST /rejectFriend
 *    - Body: { friendId }.
 *    - Xóa record trong friendships: (user1_id=friendId, user2_id=currentUserId, status='requested')
 */
exports.rejectFriend = async (req, res, next) => {
  try {
    const friendId = req.body.friendId;
    const userId = req.user.userId;
    console.log('userId', userId);
    console.log('friendId', friendId);
    
    await queryMySQL(
      "DELETE FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
      [userId, friendId, friendId, userId]
    );
    res.json({ success: true, message: "Friend request rejected" });
  } catch (err) {
    next(err);
  }
};

/**
 * 50. GET /getFriends
 *    - Lấy danh sách bạn bè của user hiện tại (status = 'accepted').
 *    - Kết hợp hai chiều: (user1_id=current AND status='accepted') OR (user2_id=current AND status='accepted').
 *    - Trả về mảng { userID, name, avatar, isOnline }.
 */
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const queryString = `
          SELECT 
              u.userId, 
              u.name, 
              u.image AS avatar,
              u.isOnline
          FROM 
              users u
          JOIN 
              friendships f ON f.user1_id = u.userId OR f.user2_id = u.userId
          WHERE 
              (f.user1_id = ? OR f.user2_id = ?) 
              AND f.status = 'accepted' 
              AND u.userId != ?`;

    const friends = await queryMySQL(queryString, [userId, userId, userId]);

    res.json({ success: true, friends });
  } catch (err) {
    next(err);
  }
};

/**
 * 51. POST /posts
 *    - Tạo bài viết feed. Body: { title, content, image_url }.
 *    - Chèn vào bảng posts (author_id từ JWT, created_at = NOW()).
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, image_url } = req.body;
    const userId = req.user.userId; // This would come from the JWT token after decoding

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const post = { userId, title, content, image_url };
    const sql = "INSERT INTO posts SET ?";
    await queryMySQL(sql, post);
    res.json({ success: true, message: "Post created" });
  } catch (err) {
    next(err);
  }
};

/**
 * 52. GET /posts
 *    - Lấy tất cả bài viết, kèm author info, view_count, like_count, comment_count.
 */
exports.getPosts = async (req, res, next) => {
  try {
    const postsSql = `
    SELECT posts.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views WHERE views.post_id = posts.post_id) as view_count,
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.post_id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.post_id) as comment_count
    FROM posts
    JOIN users ON posts.userId = users.userId`;
    let posts = await queryMySQL(postsSql);

    for (let post of posts) {
      const likesSql = `
        SELECT users.userId, users.name, users.image as avatar
        FROM likes
        JOIN users ON likes.userId = users.userId
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
 * 53. POST /posts/:post_id/view
 *    - Ghi nhận lượt xem cho post. (userId từ JWT)
 */
exports.recordPostView = async (req, res, next) => {
  try {
    const post_id = parseInt(req.params.post_id);
    const userId = req.user.userId;

    // Thêm dữ liệu vào bảng 'views'
    const sql = "INSERT INTO views (post_id, userId) VALUES (?, ?)";
    await queryMySQL(sql, [post_id, userId]);

    res.json({ success: true, message: "View recorded" });
  } catch (err) {
    next(err);
  }
};

/**
 * ----- BỐ SUNG cho các route 79–82 -----
 *
 * 79. POST /followUser
 *    - Body: { followingId }.
 *    - Chèn vào bảng user_followers (follower_id=currentUser, following_id).
 */
exports.followUser = async (req, res, next) => {
  try {
    const followerId = req.user.userId;
    const { followingId } = req.body;

    if (!followingId) {
      return res
        .status(400)
        .send({ error: true, message: "Missing followingId" });
    }

    await queryMySQL(
      "INSERT INTO user_followers (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );
    res.send({ success: true, message: "User followed successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 80. POST /unfollowUser
 *    - Body: { followingId }.
 *    - Xóa record trong user_followers.
 */
exports.unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user.userId;
    const { followingId } = req.body;

    if (!followingId) {
      return res
        .status(400)
        .send({ error: true, message: "Missing followingId" });
    }
    await queryMySQL(
      "DELETE FROM user_followers WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );
    res.send({ success: true, message: "Unfollowed user successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 81. GET /getFollowing
 *    - Lấy danh sách user mà current user đang follow.
 */
exports.getFollowing = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let results = await queryMySQL(
      "SELECT u.userID, u.name, u.email, u.image as avatar FROM user_followers uf JOIN users u ON uf.following_id = u.userID WHERE uf.follower_id = ?",
      [userId]
    );
    res.send({ success: true, following: results });
  } catch (err) {
    next(err);
  }
};

/**
 * 82. GET /getFollowers
 *    - Lấy danh sách user đang follow current user.
 */
exports.getFollowers = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let results = await queryMySQL(
      "SELECT u.userID, u.name, u.email, u.image as avatar FROM user_followers uf JOIN users u ON uf.follower_id = u.userID WHERE uf.following_id = ?",
      [userId]
    );
    res.send({ success: true, followers: results });
  } catch (err) {
    next(err);
  }
};

/**
 * 82.5 POST /allUser
 */
exports.allUser = async (req, res, next) => {
  try {
       const searchUser = req.body.searchUser;
  console.log("searchUser: ", searchUser);
  const users = await queryMySQL("SELECT * FROM users WHERE name LIKE ?", [
    `%${searchUser}%`,
  ]);
  res.json(users);
  } catch (err) {
    next(err);
  }
};
