const mongoose = require("mongoose");

const schemas = {
  organizationsSchema: new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    // login is the username
    login: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    members: {
      type: [String],
      required: true
    },
    // For future integration using GraphQL, if we decide to do so
    node_id: String,
    description: String,
    lastSyncedAt: Date
  }),
  membersSchema: new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    // Members may be part of multiple organizations
    orgs: {
      type: [String],
      required: true
    },
    login: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    avatar_url: {
      type: String,
      required: true
    },
    followers: {
      type: Number,
      required: true
    },
    following: {
      type: Number,
      required: true
    },
    node_id: String,
    type: String,
    lastSyncedAt: Date
  }),
  repositoriesSchema: new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    orgId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    node_id: String,
    description: String,
    lastSyncedAt: Date
  }),
  issuesSchema: new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    repoId: {
      type: String,
      required: true
    },
    orgId: {
      type: String,
      required: true
    },
    number: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    created_at: {
      type: Date,
      required: true
    },
    updated_at: {
      type: Date,
      required: true
    },
    closed_at: Date,
    body: String,
    node_id: String,
    lastSyncedAt: Date
  }),
  commentsSchema: new mongoose.Schema({
    id: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    repoId: {
      type: String,
      required: true
    },
    orgId: {
      type: String,
      required: true
    },
    issueId: String,
    commit_id: String,
    url: {
      type: String,
      required: true
    },
    created_at: {
      type: Date,
      required: true
    },
    updated_at: {
      type: Date,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    node_id: String,
    deleted: Boolean,
    deletedAt: Date,
    lastSyncedAt: Date
  }),
}

module.exports = schemas;
