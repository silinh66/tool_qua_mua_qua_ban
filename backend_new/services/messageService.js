// services/messageService.js
const queryMySQL = require("../utils/queryMySQL");

async function saveMessage({
  sender_id,
  receiver_id = null,
  group_id = null,
  content = "",
  image_url = "",
}) {
  return queryMySQL(
    "INSERT INTO messages (sender_id, receiver_id, group_id, content, image_url) VALUES (?, ?, ?, ?, ?)",
    [sender_id, receiver_id, group_id, content, image_url]
  );
}

module.exports = { saveMessage };
