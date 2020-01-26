const https = require("https");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: auth,
  headers: {
    "user-agent": USER
  }
};

const orgRepoMethods = {
  orgRepoSync: orgRepoSync,
};

module.exports = orgRepoMethods;

function orgRepoSync(orgModel, repoModel, res, orgId) {
  return new Promise((resolve) => {
    orgModel.findOne({id: orgId}, (err, org) => {
      if (!org) { return res.send("Error: Organization not found") }
      https.get(`${org.url}/repos`, options, (githubRes) => {
        githubRes.setEncoding("utf8");
        let data = "";
        githubRes.on("data", chunk => { data += chunk });

        githubRes.on("end", () => {
          try {
            data = JSON.parse(data);
            let i = 0;
            data.forEach((repo) => {
              repoModel.findOneAndUpdate(
                {id: repo.id},
                {
                  id: repo.id,
                  orgId: orgId,
                  name: repo.name,
                  url: repo.url,
                  node_id: repo.node_id,
                  description: repo.description,
                  lastSyncedAt: new Date()
                },
                {upsert: true, new: true},
                (err, repoRes) => {
                  if (repoRes) {
                    i++;
                    repoRes.save();
                    if (i === data.length) {
                      res.send("Success!");
                      resolve(data);
                    };
                  };
              });
            });
          } catch (e) {
            res.send("Error getting member data");
          }
        })
      }).on("error", (e) => {
        res.send("Error connecting with github");
      });
    });
  })
};
