import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

test('Frontend stack creates S3 bucket and CloudFront distribution', () => {
  const app = new cdk.App();
  const stack = new FrontendStack(app, 'TestStack', {
    env: { account: '123456789012', region: 'eu-north-1' },
  });
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::S3::Bucket', 1);
  template.resourceCountIs('AWS::CloudFront::Distribution', 1);
});
