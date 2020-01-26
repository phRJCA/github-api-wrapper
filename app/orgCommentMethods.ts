const https = require("https");
// For some reason, https.request doesn't work, but the request npm module does
// https://github.com/nodejs/help/issues/2300
const request = require("request");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: {
    user: USER,
    password: TOKEN,
  },
  headers: {
    "user-agent": USER,
  }
};

const orgCommentMethods = {
  orgCommentsAll: orgCommentsAll,
  orgCommentsSoftDeleteAll: orgCommentsSoftDeleteAll,
  commentSoftDeleteById: commentSoftDeleteById
};

module.exports = orgCommentMethods;

function orgCommentsAll(commentsModel, res, orgId) {
  commentsModel.find({orgId: orgId, deleted: {$ne: true}}, (err, comments) => {
    if (comments) {
      res.json(comments);
    } else {
      res.send("Error: Comments not found. Make sure that comments are synced properly by running /repositories/id/:repoId/comments/sync");
    };
  });
};

// This function deletes all comments from Github, but retains data within the database, marking them as deleted
function orgCommentsSoftDeleteAll(commentsModel, res, orgId) {
  commentsModel.find({orgId: orgId, deleted: {$ne: true}}, (err, comments) => {
    if (comments) {
      let i = 0;
      comments.forEach((comment) => {
        const deleteOptions = {...options, url: comment.url, method: "DELETE"};
        request.delete(deleteOptions, (githubRes) => {
          comment.deleted = true;
          comment.deletedAt = new Date();
          comment.save();
          i++;
          if (i === comments.length) { res.send("Successfully deleted all comments for this organization"); }
        })
      });
    } else {
      res.send("Error: Comments not found. Nothing to delete.");
    };
  });
}

function commentSoftDeleteById(commentsModel, res, commentId) {
  commentsModel.findOne({id: commentId, deleted: {$ne: true}}, (err, comment) => {
    if (comment) {
      const deleteOptions = {...options, url: comment.url, method: "DELETE"};
      request.delete(deleteOptions, (githubRes) => {
        comment.deleted = true;
        comment.deletedAt = new Date();
        comment.save();
        res.send("Successfully deleted comment");
      })
    } else {
      res.send("Error: Comments not found. Make sure that comments are synced properly by running /repositories/id/:repoId/comments/sync");
    };
  });
}
