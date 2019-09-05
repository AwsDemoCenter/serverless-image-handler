#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { ImageHandlerCdkStack } from '../lib/image-handler-cdk-stack';

const app = new cdk.App();
new ImageHandlerCdkStack(app, 'ImageHandlerCdkStack');