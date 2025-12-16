// controllers/topicsController.js
const queryMySQL = require("../utils/queryMySQL");

const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const checkS3Connection = require("../middlewares/checkS3Connection");

// Cấu hình AWS S3 (giả định đã set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION trong .env)
const s3 = new AWS.S3();

/**
 * 14. GET /
 */
exports.healthCheck = (req, res) => {
  return res.json({ error: false, message: "hello from Đầu Tư Bền Vững" });
};

/**
 * 15. GET /bctc/:symbol/:filename
 */
exports.downloadBCTC = [
  checkS3Connection,
  async (req, res, next) => {
    try {
      const { symbol, filename } = req.params;
      const bucket = process.env.S3_BUCKET_NAME;
      const key = `bctc/${symbol}/${filename}`;

      // Tạo pre-signed URL
      const url = s3.getSignedUrl("getObject", {
        Bucket: bucket,
        Key: key,
        Expires: 60, // URL hết hạn sau 60s
      });
      return res.redirect(url);
    } catch (err) {
      next(err);
    }
  },
];

/**
 * 16. GET /financial-reports/:symbol
 */
exports.listFinancialReports = [
  checkS3Connection,
  async (req, res, next) => {
    try {
      const { symbol } = req.params;
      const bucket = process.env.S3_BUCKET_NAME;
      const prefix = `bctc/${symbol}/`;

      // Lấy danh sách objects trong S3 dưới prefix
      const data = await s3
        .listObjectsV2({ Bucket: bucket, Prefix: prefix })
        .promise();
      const pdfFiles = data.Contents.filter((obj) =>
        obj.Key.endsWith(".pdf")
      ).map((obj) => ({
        filename: path.basename(obj.Key),
        url: s3.getSignedUrl("getObject", {
          Bucket: bucket,
          Key: obj.Key,
          Expires: 60,
        }),
      }));

      return res.json({
        error: false,
        data: pdfFiles,
        message: "Financial reports list",
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * 17. GET /getTopics/:symbol
 */
exports.getTopicsBySymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate 'sort' parameter
    const allowedSortOptions = ["newest", "most_interacted"];
    const sort = allowedSortOptions.includes(req.query.sort)
      ? req.query.sort
      : "newest";

    const offset = (page - 1) * limit;

    let orderByClause = "topics.created_at DESC"; // Default to newest
    if (sort === "most_interacted") {
      orderByClause = "(like_count + comment_count) DESC";
    }

    // SQL to fetch topics with counts
    const topicsSql = `
    SELECT 
      topics.*, 
      users.name AS author, 
      users.image AS avatar, 
      COUNT(DISTINCT views_topic.topic_id) AS view_count,
      COUNT(DISTINCT likes_topic.like_id) AS like_count,
      COUNT(DISTINCT comments_topic.comment_id) AS comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    LEFT JOIN views_topic ON views_topic.topic_id = topics.topic_id
    LEFT JOIN likes_topic ON likes_topic.topic_id = topics.topic_id
    LEFT JOIN comments_topic ON comments_topic.topic_id = topics.topic_id
    WHERE topics.symbol_name = ?
    GROUP BY topics.topic_id
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?`;

    // SQL to count total topics for the symbol
    const countSql = `
    SELECT COUNT(*) AS total
    FROM topics
    WHERE topics.symbol_name = ?`;

    // Execute both queries concurrently
    const [topics, countResult] = await Promise.all([
      queryMySQL(topicsSql, [symbol, limit, offset]),
      queryMySQL(countSql, [symbol]),
    ]);

    // Extract total count
    const total = countResult[0]?.total || 0;

    if (!Array.isArray(topics)) {
      throw new Error("Invalid topics data received from database");
    }

    // Fetch likes details for the fetched topics
    const topicIds = topics.map((topic) => topic.topic_id);
    let likes = [];
    if (topicIds.length > 0) {
      const likesSql = `
        SELECT 
          likes_topic.topic_id, 
          users.userId, 
          users.name, 
          users.image AS avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
        WHERE likes_topic.topic_id IN (?)`;
      likes = await queryMySQL(likesSql, [topicIds]);
    }

    const likesMap = {};
    likes.forEach((like) => {
      if (!likesMap[like.topic_id]) {
        likesMap[like.topic_id] = [];
      }
      likesMap[like.topic_id].push({
        userId: like.userId,
        name: like.name,
        avatar: like.avatar,
      });
    });

    let data = await queryMySQL("SELECT * FROM info_company WHERE symbol = ?", [
      symbol,
    ]);
    const enrichedTopics = topics.map((topic) => ({
      ...topic,
      likes: likesMap[topic.topic_id] || [],
      info_company: data[0],
    }));

    res.json({ success: true, total, topics: enrichedTopics });
  } catch (err) {
    next(err);
  }
};

/**
 * 18. POST /followTopic
 *     - Body: { topicId }
 */
exports.followTopic = async (req, res, next) => {
  try {
    const symbol = req.body.symbol;
    const userId = req.user.userId;

    const sql = "INSERT INTO follows_topic (userId, `symbol`) VALUES (?, ?)";
    await queryMySQL(sql, [userId, symbol]);
    return res.json({ success: true, message: "Topic followed" });
  } catch (err) {
    next(err);
  }
};

/**
 * 19. POST /unfollowTopic
 *     - Body: { topicId }
 */
exports.unfollowTopic = async (req, res, next) => {
  try {
    const symbol = req.body.symbol;
    const userId = req.user.userId;

    const sql = "DELETE FROM follows_topic WHERE `symbol` = ? AND userId = ?";
    await queryMySQL(sql, [symbol, userId]);
    return res.json({ success: true, message: "Topic unfollowed" });
  } catch (err) {
    next(err);
  }
};

/**
 * 20. GET /getFollowedTopics
 */
exports.getFollowedTopics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const sql = `
    SELECT topics.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views_topic WHERE views_topic.topic_id = topics.topic_id) as view_count,
           (SELECT COUNT(*) FROM likes_topic WHERE likes_topic.topic_id = topics.topic_id) as like_count,
           (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) as comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    WHERE topics.topic_id IN (SELECT topic_id FROM follows_topic WHERE userId = ?)`;
    let topics = await queryMySQL(sql, [userId]);

    for (let topic of topics) {
      const likesSql = `
        SELECT users.userId, users.name, users.image as avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
        WHERE likes_topic.topic_id = ?`;
      let likes = await queryMySQL(likesSql, [topic.topic_id]);
      topic.likes = likes;
    }

    res.json({ success: true, topics });
  } catch (err) {
    next(err);
  }
};

/**
 * 21. GET /getTopicsAll
 */
exports.getAllTopics = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, sortLike = "newest" } = req.query;
    const offset = (page - 1) * pageSize;

    let orderByClause = "topics.created_at DESC";

    if (sortLike === "more-interaction") {
      orderByClause = `
      (SELECT COUNT(*) FROM likes_topic WHERE likes_topic.topic_id = topics.topic_id) + 
      (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) + 
      (SELECT COUNT(*) FROM views_topic WHERE views_topic.topic_id = topics.topic_id) DESC`;
    }

    const topicsSql = `
    SELECT topics.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views_topic WHERE views_topic.topic_id = topics.topic_id) as view_count,
           (SELECT COUNT(*) FROM likes_topic WHERE likes_topic.topic_id = topics.topic_id) as like_count,
           (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) as comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    ORDER BY ${orderByClause}  -- Sắp xếp theo điều kiện đã chọn
    LIMIT ? OFFSET ?`;
    let topics = await queryMySQL(topicsSql, [
      parseInt(pageSize, 10),
      parseInt(offset, 10),
    ]);
    topics = topics.map((topic) => {
      let imgs = [];
      if (topic.image) {
        imgs =
          typeof topic.image === "string"
            ? JSON.parse(topic.image)
            : topic.image;
      }
      return { ...topic, image: imgs };
    });

    const topicIds = topics.map((t) => t.topic_id);
    let likesMap = {};
    if (topicIds.length) {
      const likesSql = `
        SELECT likes_topic.topic_id,
          users.userId,
           users.name,
            users.image AS avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
          WHERE likes_topic.topic_id IN (?)
            `;
      const allLikes = await queryMySQL(likesSql, [topicIds]);
      allLikes.forEach((l) => {
        likesMap[l.topic_id] ??= [];
        likesMap[l.topic_id].push({
          userId: l.userId,
          name: l.name,
          avatar: l.avatar,
        });
      });
    }
    topics = topics.map((t) => ({
      ...t,
      likes: likesMap[t.topic_id] || [],
    }));
    topics = topics.map((topic) => {
      let imgs = [];
      console.log("typeof topic.image", typeof topic.image);

      if (topic.image) {
        imgs =
          typeof topic.image === "string"
            ? JSON.parse(topic.image)
            : topic.image;
      }
      return { ...topic, image: imgs };
    });

    const totalResult = await queryMySQL(
      "SELECT COUNT(*) AS total FROM topics"
    );
    const totalTopics = totalResult[0].total || 0;

    return res.json({
      success: true,
      topics,
      totalTopics,
      currentPage: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 22. GET /getTopicsByUser/:userId
 */
exports.getTopicsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const sql = `
    SELECT topics.*, users.name as author, users.image as avatar, 
           (SELECT COUNT(*) FROM views_topic WHERE views_topic.topic_id = topics.topic_id) as view_count,
           (SELECT COUNT(*) FROM likes_topic WHERE likes_topic.topic_id = topics.topic_id) as like_count,
           (SELECT COUNT(*) FROM comments_topic WHERE comments_topic.topic_id = topics.topic_id) as comment_count
    FROM topics
    JOIN users ON topics.userId = users.userId
    WHERE topics.userId = ?
    ORDER BY topics.created_at DESC`;

    let topics = await queryMySQL(sql, [userId]);

    // Parse image field from JSON string to array
    topics = topics.map((topic) => {
      let imgs = [];
      if (topic.image) {
        imgs =
          typeof topic.image === "string"
            ? JSON.parse(topic.image)
            : topic.image;
      }
      return { ...topic, image: imgs };
    });

    // Get all topic IDs and fetch likes in one query
    const topicIds = topics.map((t) => t.topic_id);
    let likesMap = {};
    if (topicIds.length) {
      const likesSql = `
        SELECT likes_topic.topic_id,
          users.userId,
           users.name,
            users.image AS avatar
        FROM likes_topic
        JOIN users ON likes_topic.userId = users.userId
          WHERE likes_topic.topic_id IN (?)
            `;
      const allLikes = await queryMySQL(likesSql, [topicIds]);
      allLikes.forEach((l) => {
        likesMap[l.topic_id] ??= [];
        likesMap[l.topic_id].push({
          userId: l.userId,
          name: l.name,
          avatar: l.avatar,
        });
      });
    }

    // Map likes to topics
    topics = topics.map((t) => ({
      ...t,
      likes: likesMap[t.topic_id] || [],
    }));

    res.json({ success: true, topics });
  } catch (err) {
    next(err);
  }
};

/**
 * 23. POST /createTopic
 */
exports.createTopic = async (req, res, next) => {
  try {
    let {
      title,
      image,
      symbol_name,
      description,
      userId,
      recommendation,
      price,
    } = req.body;
    let data = await queryMySQL("SELECT * FROM info_company");
    let dataFollow = await queryMySQL(
      "SELECT * FROM follows_topic WHERE userId = ?",
      [userId]
    );
    if (!title || !symbol_name || !description || !userId) {
      return res
        .status(400)
        .send({ error: true, message: "Bạn phải nhập đầy đủ nội dung!" });
    }
    const isFollowing = dataFollow.some(
      (follow) => follow.symbol === symbol_name
    );
    if (!isFollowing) {
      return res.status(400).send({
        error: true,
        message: `Bạn phải tham gia group ${symbol_name} mới có thể đăng bài!`,
      });
    }
    const validRecommendations = ["BUY", "SELL", null, undefined];
    if (!validRecommendations.includes(recommendation)) {
      return res
        .status(400)
        .send({ error: true, message: "Invalid recommendation value" });
    }
    const existingPosts = await queryMySQL(
      "SELECT recommendation, price FROM topics WHERE symbol_name = ? AND userId = ? ORDER BY created_at DESC LIMIT 1",
      [symbol_name, userId]
    );
    let lastRecommendation =
      existingPosts.length > 0 ? existingPosts[0].recommendation : null;
    let lastPrice =
      existingPosts.length > 0 ? parseFloat(existingPosts[0].price) : null;
    if (!lastRecommendation) {
      if (recommendation !== "BUY" && recommendation !== null) {
        return res.status(400).send({
          error: true,
          message: "Lần đầu chỉ được khuyến nghị mua hoặc không khuyến nghị",
        });
      }
    } else if (lastRecommendation === "BUY") {
      if (recommendation !== "SELL" && recommendation !== null) {
        return res.status(400).send({
          error: true,
          message:
            "Sau khi mua chỉ được khuyến nghị bán hoặc không khuyến nghị",
        });
      }
    } else if (lastRecommendation === "SELL") {
      if (recommendation !== "BUY" && recommendation !== null) {
        return res.status(400).send({
          error: true,
          message:
            "Sau khi bán thì chỉ được khuyến nghị mua hoặc không khuyến nghị",
        });
      }
    }
    let profitLossPercentage = null;
    if (
      recommendation === "SELL" &&
      lastRecommendation === "BUY" &&
      lastPrice
    ) {
      profitLossPercentage = ((price - lastPrice) / lastPrice) * 100;
    }
    const imagesArray = Array.isArray(image) ? image : image ? [image] : [];
    const imageJson = JSON.stringify(imagesArray);
    await queryMySQL(
      "INSERT INTO topics (title, image, symbol_name, description, userId, created_at, recommendation, price, profit_loss) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        imageJson,
        symbol_name,
        description,
        userId,
        moment().format("YYYY-MM-DD HH:mm:ss"),
        recommendation || null, // Nếu không có khuyến nghị thì lưu NULL
        price,
        profitLossPercentage, // Lưu % lợi nhuận/lỗ vào database (nếu có)
      ]
    );
    res.send({
      error: false,
      message: "New topic created successfully",
      profitLossPercentage:
        profitLossPercentage !== null
          ? `${profitLossPercentage.toFixed(2)}%`
          : "N/A",
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopicsLeaderboard = async (req, res, next) => {
  try {
    const rows = await queryMySQL(
      `SELECT 
        u.image AS avatar, 
         u.name,
         u.userId,
         t.symbol_name AS stock,
         MAX(t.profit_loss) AS highest_profit_loss,
          (
          SELECT created_at 
              FROM topics 
               WHERE userId = t.userId 
                AND symbol_name = t.symbol_name 
                         AND recommendation = 'BUY'
                         ORDER BY created_at DESC 
                           LIMIT 1
                            ) AS buy_recommend_date,
                              (
                            SELECT price 
                                FROM topics 
                                     WHERE userId = t.userId 
                                        AND symbol_name = t.symbol_name 
                                             AND recommendation = 'BUY'
                                                 ORDER BY created_at DESC 
                                                  LIMIT 1
                                                  ) AS buy_recommend_price,
                                                    (
                                                       SELECT COUNT(*) 
                                                           FROM topics 
                                                             WHERE userId = t.userId 
                                                                 AND symbol_name = t.symbol_name 
                                                                         AND recommendation = 'BUY'
                                                                               ) AS buy_count
                                                                                FROM topics t
                                                                                 JOIN users u ON t.userId = u.userId
                                                                                   WHERE t.profit_loss IS NOT NULL
                                                                                       GROUP BY t.userId, t.symbol_name
                                                                                         ORDER BY highest_profit_loss DESC`
    );
    const leaderboardGrouped = rows?.reduce((acc, row) => {
      const userId = row.userId;
      if (!acc[userId]) {
        acc[userId] = {
          avatar: row.avatar,
          name: row.name,
          userId: row.userId,
          recommendations: [],
        };
      }
      acc[userId].recommendations.push({
        stock: row.stock,
        highest_profit_loss: row.highest_profit_loss,
        buy_recommend_date: row.buy_recommend_date,
        buy_recommend_price: row.buy_recommend_price,
        buy_count: row.buy_count,
      });
      return acc;
    }, {});
    const leaderboard = Object.values(leaderboardGrouped);
    res.status(200).send({
      error: false,
      leaderboard,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 24. POST /topics/:topic_id/view
 */
exports.recordTopicView = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO views_topic (topic_id, userId) VALUES (?, ?)";
    await queryMySQL(sql, [topic_id, userId]);

    res.json({ success: true, message: "View recorded" });
  } catch (err) {
    next(err);
  }
};

/**
 * 25. POST /topics/:topic_id/like
 */
exports.likeTopic = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);
    const userId = req.user.userId;

    const sql = "INSERT INTO likes_topic (topic_id, userId) VALUES (?, ?)";
    await queryMySQL(sql, [topic_id, userId]);
    res.json({ success: true, message: "Topic liked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 26. POST /topics/:topic_id/unlike
 */
exports.unlikeTopic = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);
    const userId = req.user.userId;

    const sql = "DELETE FROM likes_topic WHERE topic_id = ? AND userId = ?";
    await queryMySQL(sql, [topic_id, userId]);
    res.json({ success: true, message: "Topic unliked" });
  } catch (err) {
    next(err);
  }
};

/**
 * 27. POST /topics/:topic_id/comments
 */
exports.createComment = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);
    const userId = req.user.userId;
    const { content, parent_id } = req.body; // Include field parent_id

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = { topic_id, userId, content, parent_id, created_at: new Date() };
    const sql = "INSERT INTO comments_topic SET ?";
    await queryMySQL(sql, comment);
    res.json({ success: true, message: "Comment created", comment });
  } catch (err) {
    next(err);
  }
};

/**
 * 28. GET /topics/:topic_id/comments
 */
exports.getTopicComments = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);

    const commentsSql = `
    SELECT 
      comments_topic.*, 
      users.name, 
      users.image AS avatar,
      COUNT(likes_comment.id) AS like_count
    FROM 
      comments_topic
    JOIN 
      users ON comments_topic.userId = users.userId
    LEFT JOIN 
      likes_comment ON comments_topic.comment_id = likes_comment.comment_id
    WHERE 
      comments_topic.topic_id = ?
    GROUP BY 
      comments_topic.comment_id
    ORDER BY 
      comments_topic.created_at DESC;`;

    const likersSql = `
    SELECT 
      likes_comment.comment_id,
      users.userId,
      users.name,
      users.image AS avatar
    FROM 
      likes_comment
    JOIN 
      users ON likes_comment.userId = users.userId
    WHERE 
      likes_comment.topic_id = ?;`;

    const comments = await queryMySQL(commentsSql, [topic_id]);
    const likers = await queryMySQL(likersSql, [topic_id]);

    const likersMap = likers.reduce((acc, liker) => {
      if (!acc[liker.comment_id]) acc[liker.comment_id] = [];
      acc[liker.comment_id].push({
        userId: liker.userId,
        name: liker.name,
        avatar: liker.avatar,
      });
      return acc;
    }, {});

    // Attach likers to comments
    const enrichedComments = comments.map((comment) => ({
      ...comment,
      liked_by: likersMap[comment.comment_id] || [],
    }));

    res.json({ success: true, comments: enrichedComments });
  } catch (err) {
    next(err);
  }
};

/**
 * 29. GET /topics/:topic_id/likes
 */
exports.getTopicLikes = async (req, res, next) => {
  try {
    const topic_id = parseInt(req.params.topic_id);
    const sql = `
    SELECT likes_topic.*, users.name, users.image as avatar
    FROM likes_topic
    JOIN users ON likes_topic.userId = users.userId
    WHERE likes_topic.topic_id = ?`;

    let likes = await queryMySQL(sql, [topic_id]);
    res.json({ success: true, likes });
  } catch (err) {
    next(err);
  }
};
