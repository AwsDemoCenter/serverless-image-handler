import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway')
import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import { RestApi, EndpointType } from '@aws-cdk/aws-apigateway';
import iam = require('@aws-cdk/aws-iam');
import cf = require('@aws-cdk/aws-cloudfront')
import { PriceClass, ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import cfn = require('@aws-cdk/aws-cloudformation')
import { Duration } from '@aws-cdk/core';

export class ImageHandlerCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const image_handler_cn_public = s3.Bucket.fromBucketAttributes(this,'image-handler-cn-public',{
        bucketArn: 'arn:aws-cn:s3:::image-handler-cn-public'
    })

    //image hanlder lambda
    const image_handler = new lambda.Function(this, 'image_handler',{
      runtime: lambda.Runtime.NODEJS_8_10,
      // code: lambda.Code.asset('image_handler'),
      code: lambda.Code.fromBucket(image_handler_cn_public,'image_handler.zip'),
      handler: 'index.handler',
      memorySize: 1024,
      timeout: Duration.seconds(30)
      // environment: {
      //   SOURCE_BUCKETS: 'pwmimage'
      // }
    })

    image_handler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [ 's3:*' ],
      resources: [ '*' ]
    }))

    //custom resource lambda
    const custom_resource = new lambda.Function(this, 'custom_resource',{
      runtime: lambda.Runtime.NODEJS_8_10,
      // code: lambda.Code.asset('custom_resource'),
      code: lambda.Code.fromBucket(image_handler_cn_public,'custom_resource.zip'),
      handler: 'index.handler'
    })

    custom_resource.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [ 's3:*' ],
      resources: [ '*' ]
    }))

    //apigateway
    const execapi = new apigateway.LambdaRestApi(this,'image_handler_api',{
      handler: image_handler,
      restApiName: 'image_handler_api',
      endpointTypes: [EndpointType.REGIONAL],
      binaryMediaTypes: ['*/*'],
      proxy: true
    })

    //create image-demo-ui bucket
    const siteBucket = new s3.Bucket(this, 'image-demo-ui', {
      // bucketName: 'image-demo-ui',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // NOT recommended for production code
    });

    //custom copyS3assets
    new cfn.CustomResource(this,'copyS3assets',{
      provider: cfn.CustomResourceProvider.lambda(custom_resource),
      properties:{
        manifestKey: "demo-ui-manifest.json", 
        sourceS3Bucket: "image-handler-cn-public", 
        sourceS3key: "demo-ui", 
        destS3Bucket: siteBucket.bucketName, 
        version: "v4.0.0", 
        customAction: "copyS3assets" 
      }
    })

     //cfn image_handler_dist
    //  const image_handler_dist = new cf.CloudFrontWebDistribution(this, "image_handler_dist", {
    //   viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
    //     priceClass: PriceClass.PRICE_CLASS_ALL,
    //     enableIpV6: false,
    //     originConfigs: [
    //       {
    //         originPath: '/prod',
    //         customOriginSource: {
    //           domainName:cdk.Fn.select(2, cdk.Fn.split("/", execapi.url))
    //         },
    //         behaviors: [
    //           {
    //             isDefaultBehavior: true
    //           }
    //         ]
    //       }
    //     ]
    //   });

     //cfn demo_ui_dist
    //  const demo_ui_dist = new cf.CloudFrontWebDistribution(this, "demo_ui_dist", {
    //   viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
    //     priceClass: PriceClass.PRICE_CLASS_ALL,
    //     enableIpV6: false,
    //     originConfigs: [
    //       {
    //         s3OriginSource:{
    //           s3BucketSource: siteBucket
    //         },
    //         behaviors: [
    //           {
    //             isDefaultBehavior: true
    //           }
    //         ]
    //       }
    //     ]
    //   });

    // custom putConfigFile
    new cfn.CustomResource(this,'putConfigFile',{
      provider: cfn.CustomResourceProvider.lambda(custom_resource),
      properties:{
        configItem : { 
          "apiEndpoint" : execapi.url
        } ,
        destS3Bucket : siteBucket.bucketName,
        destS3key : "demo-ui-config.js",
        customAction: "putConfigFile"
      }
    })

    new cdk.CfnOutput(this, 'image-hanlder-ui', { value: siteBucket.bucketWebsiteUrl });
    new cdk.CfnOutput(this, 'image-handler-api', { value: execapi.url });
  }
}
