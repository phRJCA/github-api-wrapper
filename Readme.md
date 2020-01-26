## Usage Guide:
---
#### Initialize your Github Account
#### Step 1:
- Generate your own personal access token under https://github.com/settings/tokens with your own security preferences (check everything to ensure that all endpoints work properly). Make sure to copy this token as it will be used later on
#### Step 2:
- Create an organization (https://github.com/organizations/plan), if you don't have one (Creating an organization is currently unsupported via Github API on a personal account)
#### Step 3:
- Create your own repositories, issues, comments for testing (this step should disappear once tests are added)
#### Step 4:
- To activate webhooks, complete your Github Organization Settings (https://github.com/organizations/your-org-name-here/settings/hooks/new).
- Under Payload URL, add your ngrok https URL (download ngrok here https://ngrok.com/) after running `ngrok http 3000` (example: https://13df13a1.ngrok.io/github/webhooks)
- Under Content type, choose `application/json`
- Feel free to keep Secret blank, this security feature is currently unsupported
- Under triggers, tick `Send me everything` to make sure that all relevant webhooks are processed
---
#### Running your app
#### Step 1:
- Run `make user="your-github-username-here" token="your-github-personal-access-token-here" run`. This should add settings.json on your app. Alternatively (for windows users), create a `settings.json` file with the following format: `{"USER": "your-github-username-here","TOKEN": "your-github-personal-access-token-here"}`
#### Step 2:
- Run your local mongo instance `mongod --dbpath "your-db-path-here"` (First time mongodb user? Follow installation steps here: https://github.com/mongodb/node-mongodb-native)
#### Step 3:
- Run `npm install` && `npm start`
#### Step 4:
- Play around! (Tip: Hit the `/syncAll` endpoint to see your database populate immediately)
---
#### Known Issues (TODO):
1) If you find yourself having to call the Github API methods within this wrapper and needing more than 30 events, feel free to submit an issue with your solution and add pagination for the relevant items following the github docs here: https://developer.github.com/v3/#pagination
-- Note: This is especially important when syncing huge repositories
-- Suggested, untested, off-the-top-of-my-head pseudocode solution:
```
let page = 1;
const url = `${homeurl}?page=${page}&per_page=100`
http.get(url, opts, (res) => {
  res.on("end", () => {
    data = JSON.parse(data);
    ...some stuff here
    while (data.length === 100) {
      page += 1;
      http.get(`${url}`, () => ...)
    }
  })
})
```
2) Migration to Typescript ongoing (.ts files, but they're technically just js code for now)
3) GithubAPI class refactoring to reduce redundancy
4) Github Webhook verification
5) schemas.js refactoring, one collection schema per file (not a problem right now due to a low number of collections)
6) Further split app.js code (ex: routes, webhooks, etc.)
7) Tests. Create repositories, issues, comments for a specific organization for immediate testing.
8) Dockerfile
---
> Other info:
MongoDB is selected mainly for code familiarity. Also, its popularity and ease of use (Javascript everywhere), along with its scalability and flexibility makes it easier to adapt for a lot of developers. Joins will be a pain, but faster development time is a priority for now. Fun fact: MongoDB is now ACID compliant: https://techcrunch.com/2018/02/15/mongodb-gets-support-for-multi-document-acid-transactions/