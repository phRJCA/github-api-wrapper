const https = require("https");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: auth,
  headers: {
    "user-agent": USER
  }
};

const repoCommentMethods = {
  repoCommitCommentsSync: repoCommitCommentsSync,
  repoIssuesCommentsSync: repoIssuesCommentsSync,
};

module.exports = repoCommentMethods;

function repoCommitCommentsSync(repoModel, commentsModel, res, repoId) {
  return new Promise((resolve) => {
    repoModel.findOne({id: repoId}, (err, repo) => {
      if (!repo) { return res.send("Error: Repository not found") }
          
      https.get(`${repo.url}/comments`, options, (githubRes) => {
        githubRes.setEncoding("utf8");
        let data = "";
        githubRes.on("data", chunk => { data += chunk });

        githubRes.on("end", () => {
          try {
            data = JSON.parse(data);
            let i = 0;
            data.forEach((comment) => {
              commentsModel.findOneAndUpdate(
                {id: comment.id},
                {
                  id: comment.id,
                  userId: comment.user.id,
                  repoId: repoId,
                  orgId: repo.orgId,
                  commit_id: comment.commit_id,
                  url: comment.url,
                  created_at: comment.created_at,
                  updated_at: comment.updated_at,
                  body: comment.body,
                  node_id: comment.node_id,
                  lastSyncedAt: new Date()
                },
                {upsert: true, new: true},
                (err, commRes) => {
                  if (commRes) {
                    i++;
                    commRes.save();
                    if (i === data.length) {
                      res.send("Success!");
                      resolve();
                    };
                  };
              });
            });
          } catch (e) {
            res.send("Error getting comments data");
          }
        })
      }).on("error", (e) => {
        res.send("Error connecting with github");
      });
    });
  })
};

function repoIssuesCommentsSync(repoModel, commentsModel, res, repoId) {
  return new Promise((resolve) => {
    repoModel.findOne({id: repoId}, (err, repo) => {
      if (!repo) { return res.send("Error: Repository not found") }
          
      https.get(`${repo.url}/issues/comments`, options, (githubRes) => {
        githubRes.setEncoding("utf8");
        let data = "";
        githubRes.on("data", chunk => { data += chunk });

        githubRes.on("end", () => {
          try {
            data = JSON.parse(data);
            let i = 0;
            data.forEach((comment) => {
              // For some reason, issueId is not available here, but the issue url is
              getIssueIdForComment(comment.issue_url).then((issueId) => {
                commentsModel.findOneAndUpdate(
                  {id: comment.id},
                  {
                    id: comment.id,
                    userId: comment.user.id,
                    repoId: repoId,
                    orgId: repo.orgId,
                    issueId: issueId,
                    url: comment.url,
                    created_at: comment.created_at,
                    updated_at: comment.updated_at,
                    body: comment.body,
                    node_id: comment.node_id,
                    lastSyncedAt: new Date()
                  },
                  {upsert: true, new: true},
                  (err, commRes) => {
                    if (commRes) {
                      i++;
                      commRes.save();
                      if (i === data.length) {
                        res.send("Success!");
                        resolve(data);
                      };
                    };
                });
              })
            });
          } catch (e) {
            res.send("Error getting comments data");
          }
        })
      }).on("error", (e) => {
        res.send("Error connecting with github");
      });
    });
  });
};

function getIssueIdForComment(issueUrl) {
  return new Promise((resolve) => {
    https.get(issueUrl, options, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => { data += chunk; })
      res.on("end", () => {
        data = JSON.parse(data);
        resolve(data.id);
      });
    });
  });
};

