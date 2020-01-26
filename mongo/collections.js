const { organizationsSchema, membersSchema, repositoriesSchema, issuesSchema, commentsSchema } = require("./schemas");
const mongoose = require("mongoose");

const models = {
  Organizations: mongoose.model("Organizations", organizationsSchema),
  Members: mongoose.model("Members", membersSchema),
  Repositories: mongoose.model("Repositories", repositoriesSchema),
  Issues: mongoose.model("Issues", issuesSchema),
  // Commits: mongoose.model("Commits", commitsSchema),
  Comments: mongoose.model("Comments", commentsSchema),
}

module.exports = models;
