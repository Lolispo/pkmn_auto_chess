#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const region = app.node.tryGetContext('region') || 'eu-north-1';

new FrontendStack(app, 'PkmnAutoChessFrontend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region,
  },
});
