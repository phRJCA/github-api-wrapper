const https = require("https");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: auth,
  headers: {
    "user-agent": USER
  }
};

const webhookMethods = {
  upsertComment: upsertComment,
  upsertIssue: upsertIssue,
};

module.exports = webhookMethods;

function upsertComment(commentType, commentsModel, reqBody, res) {
  const { organization, repository, issue, comment } = reqBody;
  commentsModel.findOneAndUpdate(
    {id: comment.id},
    {
      id: comment.id,
      userId: comment.user.id,
      repoId: repository.id,
      orgId: organization.id,
      issueId: issue.id || null,
      commit_id: comment.commit_id || null,
      url: comment.url,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      body: comment.body,
      node_id: comment.node_id,
    },
    {upsert: true, new: true},
    (err, commRes) => {
      if (commRes) {
        commRes.save();
        res.sendStatus(200)
      };
  });
};

function upsertIssue(issuesModel, reqBody, res) {
  const { organization, repository, issue } = reqBody;
  issuesModel.findOneAndUpdate(
    {id: issue.id},
    {
      id: issue.id,
      userId: issue.user.id,
      repoId: repository.id,
      orgId: organization.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      body: issue.body,
      node_id: issue.node_id,
    },
    {upsert: true, new: true},
    (err, issueRes) => {
      if (issueRes) {
        issueRes.save();
        res.sendStatus(200)
      };
  });
};
