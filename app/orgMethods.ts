const https = require("https");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: auth,
  headers: {
    "user-agent": USER
  }
};

const orgMethods = {
  orgFindById: orgFindById,
  orgSync: orgSync,
};

module.exports = orgMethods;

function orgFindById(orgModel, res, orgId) {
  orgModel.findOne({id: orgId}, (err, org) => {
    if (org) {
      res.json(org);
    } else {
      res.send("Error: Organization not found. Make sure that organizations are synced properly by running /organizations/sync");
    };
  });  
};

function orgSync(orgModel, res) {
  return new Promise((resolve) => {
    https.get("https://api.github.com/user/orgs", options, (githubRes) => {
      githubRes.setEncoding("utf8")

      let data = "";
      githubRes.on("data", chunk => { data += chunk; });
      githubRes.on("end", () => {
        try {
          data = JSON.parse(data);
            let i = 0;
            data.forEach((org) => {
              getOrgMembers(org.login).then((members) => {
                orgModel.findOneAndUpdate(
                  {id: org.id},
                  {
                    id: org.id,
                    login: org.login,
                    url: org.url,
                    members: members,
                    node_id: org.node_id,
                    description: org.description,
                    lastSyncedAt: new Date()
                  },
                  {upsert: true, new: true},
                  (err, orgRes) => {
                    if (orgRes) {
                      i++;
                      orgRes.save();
                      if (i === data.length) {
                        res.send("Success!")
                        resolve(data);
                      }
                    }
                  }
                );
              })
            });
        } catch (e) {
          res.send("Error syncing data from user organizations");
        };
      });
    });
  })
};

function getOrgMembers(orgLogin) {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/orgs/${orgLogin}/members`, options, (res) => {
      res.setEncoding("utf8")
      let data = "";
      res.on("data", chunk => { data += chunk; })

      res.on("end", () => {
        data = JSON.parse(data);
        resolve(data.map((member) => member.id))
      });
    });
  });
};