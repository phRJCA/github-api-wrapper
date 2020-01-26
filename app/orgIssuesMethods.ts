const https = require("https");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: auth,
  headers: {
    "user-agent": USER
  }
};

const orgIssuesMethods = {
  orgIssuesSync: orgIssuesSync,
};

module.exports = orgIssuesMethods;

function orgIssuesSync(orgModel, issuesModel, res, orgId) {
  orgModel.findOne({id: orgId}, (err, org) => {
    if (!org) { return res.send("Error: Organization not found") }
    https.get(`${org.url}/issues?filter=all`, options, (githubRes) => {
      githubRes.setEncoding("utf8");
      let data = "";
      githubRes.on("data", chunk => { data += chunk });

      githubRes.on("end", () => {
        try {
          data = JSON.parse(data);
          let i = 0;
          data.forEach((issue) => {
            issuesModel.findOneAndUpdate(
              {id: issue.id},
              {
                id: issue.id,
                userId: issue.user.id,
                repoId: issue.repository.id,
                orgId: orgId,
                number: issue.number,
                title: issue.title,
                state: issue.state,
                url: issue.url,
                created_at: issue.created_at,
                updated_at: issue.updated_at,
                closed_at: issue.closed_at,
                body: issue.body || null,
                node_id: issue.node_id,
                lastSyncedAt: new Date()
              },
              {upsert: true, new: true},
              (err, issueRes) => {
                if (issueRes) {
                  i++;
                  issueRes.save();
                  if (i === data.length) { res.send("Success!"); };
                };
            });
          });
        } catch (e) {
          res.send("Error getting issues data");
        }
      })
    }).on("error", (e) => {
      res.send("Error connecting with github");
    });
  });
};
