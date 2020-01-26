const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

const mongoose = require("mongoose");
const mongourl = process.env.MONGO_URL;
// mongoose.set("debug", true);

mongoose.connect(mongourl, { keepAlive: 1, useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true }).then((res) => {
  require("../mongo/collections.js");
  const {
    Organizations,
    Members,
    Repositories,
    Issues,
    Comments
  } = mongoose.models;

  const { orgFindById, orgSync } = require("./orgMethods.ts");
  const { orgGetMembersByHighestFollowers, orgMembersSync } = require("./orgMemberMethods.ts");
  const { orgRepoSync } = require("./orgRepoMethods.ts");
  const { repoCommitCommentsSync, repoIssuesCommentsSync } = require("./repoCommentMethods.ts");
  const { orgIssuesSync } = require("./orgIssuesMethods.ts");
  const { orgCommentsAll, orgCommentsSoftDeleteAll, commentSoftDeleteById } = require("./orgCommentMethods.ts");

  // This order should be preserved for proper routing
  // WARNING: syncAll may be nonperformant once used on a huge organization
  // Notes:
  // - syncAll follows Github limits, and is currently using the default of 30 events per call
  // - to ensure data integrity for large organizations, use pagination
  app.get("/syncAll", (req, res) => {
    // As syncAll passes through all sync-related functions, only the last res is important
    // fakeRes allows continuing throughout all functions
    const fakeRes = { send: function(){} }
    const orgs = orgSync(Organizations, fakeRes).then(allOrgs => {
      allOrgs.forEach(org => {
        if (org.id == 12688176) {return};
        orgMembersSync(Organizations, Members, fakeRes, org.id);
        orgIssuesSync(Organizations, Issues, fakeRes, org.id);
        orgRepoSync(Organizations, Repositories, fakeRes, org.id).then(repos => {
          new Promise((resolve) => {
            let i = 0;
            repos.forEach(repo => {
              Promise.all([
                repoCommitCommentsSync(Repositories, Comments, fakeRes, repo.id),
                repoIssuesCommentsSync(Repositories, Comments, fakeRes, repo.id)
              ]).then(() => {
                i++;
                if (i === repos.length) { resolve() }
              });
            });
          }).then(() => res.send("Successfully synced all relevant collections!"));
        });
      });
    })
  })

  app.get("/organizations/sync", (req, res) => { orgSync(Organizations, res) });
  app.get("/organizations/id/:orgId/members/sync", (req, res) => { orgMembersSync(Organizations, Members, res, req.params.orgId) });
  app.get("/organizations/id/:orgId/members", (req, res) => { orgGetMembersByHighestFollowers(Members, res, req.params.orgId) });
  app.get("/organizations/id/:orgId/repo/sync", (req, res) => { orgRepoSync(Organizations, Repositories, res, req.params.orgId) });
  app.get("/organizations/id/:orgId/issues/sync", (req, res) => { orgIssuesSync(Organizations, Issues, res, req.params.orgId) });
  app.get("/organizations/id/:orgId/comments", (req, res) => { orgCommentsAll(Comments, res, req.params.orgId) });
  app.get("/organizations/id/:orgId/comments/deleteAll", (req, res) => { orgCommentsSoftDeleteAll(Comments, res, req.params.orgId) });
  app.get("/organizations/id/:orgId", (req, res) => { orgFindById(Organizations, res, req.params.orgId) });

  app.get("/repositories/id/:repoId/comments/sync", (req, res) => { repoCommitCommentsSync(Repositories, Comments, res, req.params.repoId) });
  app.get("/repositories/id/:repoId/issues/comments/sync", (req, res) => { repoIssuesCommentsSync(Repositories, Comments, res, req.params.repoId) });

  app.get("/comment/:commentId/delete", (req, res) => { commentSoftDeleteById(Comments, res, req.params.commentId) });

  // Github Webhooks
  app.use(bodyParser.json())
  const { GITHUB_WEBHOOK_TOKEN } = require("../settings.json");
  const { upsertComment, upsertIssue } = require("./webhookMethods.ts");

  // Persist Github Issues, Comments
  // * Easiest way would be to run /syncAll on an interval, but that will be highly nonperformant
  // Other more performant choices:
  // NOTE: Polling vs Webhooks (Chose webhooks. Syncing all comments on an interval would lead to huge performance issues, fast)
  // Polling Cons:
  // - GET on organizational comment commits do not allow sorting by updated at, which means that comments will never be "edited" if a cursor is used,
  //    or all comments would have to be queried all the time to make sure that data is consistent
  // - Runs on an interval, whether or not there is a new event (Perf Issue)
  // Webhooks Cons:
  // - Github does not send edited comments as a webhook, which means that only original comments are retained
  app.post("/github/webhooks", ( req, res ) => {
    // WARNING: Possible security issue
    // TODO: Verify github webhook
    const event = req.body;
    if (event.comment) {
      if (event.issue && event.action === "created") {
        upsertComment("issue", Comments, req.body, res);
      } else if (event.action === "created") {
        upsertComment("commit", Comments, req.body, res);
      }
    } else if (event.issue) {
      // Simply update for now
      if (event.action === "opened" || event.action === "edited" || event.action === "closed") {
        upsertIssue(Issues, req.body, res);
      }
    } else {
      // Ignore all other types of webhooks
      console.log("Received and ignored webhook");
      res.sendStatus( 200 );  
    }    
  });

  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
});
