const https = require("https");
const { USER, TOKEN } = require("../settings.json");
const auth = `${USER}:${TOKEN}`;
const options = {
  auth: auth,
  headers: {
    "user-agent": USER
  }
};

const orgMemberMethods = {
  orgGetMembersByHighestFollowers: orgGetMembersByHighestFollowers,
  orgMembersSync: orgMembersSync,
};

module.exports = orgMemberMethods;

function orgGetMembersByHighestFollowers(memberModel, res, orgId) {
  memberModel.find({orgs: orgId}).sort({followers: -1}).exec((err, members) => {
    if (members) {
      res.json(members);
    } else {
      res.send("Error: Members not found. Make sure that members are synced properly by running /organizations/id/:orgId/members/sync");
    };
  });
};

function orgMembersSync(orgModel, memberModel, res, orgId) {
  orgModel.findOne({id: orgId}, (err, org) => {
    if (!org) { return res.send("Error: Organization not found") }
    https.get(`${org.url}/members`, options, (githubRes) => {
      githubRes.setEncoding("utf8");
      let data = "";
      githubRes.on("data", chunk => { data += chunk });

      githubRes.on("end", () => {
        try {
          data = JSON.parse(data);
          let i = 0;
          data.forEach((member) => {
            Promise.all([
              getMemberOrgs(member.login, orgId, options),
              getFollowingCount(member.login, options),
              getFollowersCount(member.login, options)
            ]).then(results => {
              memberModel.findOneAndUpdate(
                {id: member.id},
                {
                  id: member.id,
                  orgs: results[0],
                  login: member.login,
                  url: member.url,
                  avatar_url: member.avatar_url,
                  following: results[1],
                  followers: results[2],
                  node_id: member.node_id,
                  type: member.type,
                  lastSyncedAt: new Date()
                },
                {upsert: true, new: true},
                (err, memRes) => {
                  if (memRes) {
                    i++;
                    memRes.save();
                    if (i === data.length) { res.send("Success!"); };
                  };
              });
            })
          });
        } catch (e) {
          res.send("Error getting member data");
        }
      })
    }).on("error", (e) => {
      res.send("Error connecting with github");
    });
  });
};

function getMemberOrgs(user, orgId, options) {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/users/${user}/orgs`, options, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => { data += chunk; })
      res.on("end", () => {
        data = JSON.parse(data);
        // > /users/${user}/orgs only gets public info, which may not include the current orgId if it is set to private (default)
        resolve(data.map(orgs => orgs.id).concat(orgId));
      });
    });
  });
};

function getFollowingCount(user, options) {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/users/${user}/following`, options, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => { data += chunk; })
      res.on("end", () => {
        data = JSON.parse(data);
        resolve(data.length);
      });
    });
  });
};

function getFollowersCount(user, options) {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/users/${user}/followers`, options, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        data = JSON.parse(data);
        resolve(data.length);
      });
    });
  });
};
