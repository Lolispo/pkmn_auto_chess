import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { WakeableFargateService } from 'web-platform';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reuse the platform wildcard cert (published by web-platform's HostingStack).
    const certificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/platform/wildcard-cert-arn',
    );

    // Docker build context is the repo root (one level up from infra/).
    const repoRoot = path.join(__dirname, '..', '..');

    new WakeableFargateService(this, 'Backend', {
      appId: 'pkmn',
      domainName: 'petterbuilds.com',
      certificateArn,
      image: ecs.ContainerImage.fromAsset(repoRoot),
      frontendOrigin: 'https://pkmn.petterbuilds.com',
      containerPort: 8000,
      healthPath: '/health',
      idleGraceMinutes: 15,
    });
  }
}
