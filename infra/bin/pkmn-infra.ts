#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// Pin the region so it never drifts with the profile/CLI default (the `private`
// profile has no region set → would otherwise inherit eu-west-1). Matches the
// web-platform stacks, which are all eu-north-1.
new BackendStack(app, 'PkmnBackend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-north-1',
  },
});
