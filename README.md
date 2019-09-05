#Getting Started

### Prerequisites

- [Node.js (>= 8.11.x)](https://nodejs.org/en/download)
- You must specify both your credentials and an AWS **China** Region to use the AWS CDK CLI, as described in Specifying Your Credentials and Region.
- S3和api gateway服务已开通80 443端口

### Installation
* Installing the AWS CDK

  ```
  npm install -g aws-cdk@1.5.0
  ```

* Run the following command to see the version number of the AWS CDK.

  ```
  cdk --version
  ```

* Download code

  ```
  git clone https://github.com/AwsDemoCenter/serverless-image-handler.git
  ```

* Installing the dependency

  ```
  cd serverless-image-handler
  npm i
  ```

* Initialization CDK

  ```
  cdk init
  ```

### Deploy serverless image handler

 *  compile typescript to js

   ```
   npm run build
   ```

 * deploy this stack to your default AWS account/region

   ```
   cdk deploy
   ```

### Other Useful command

 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

* `npm run watch`   watch for changes and compile

### Trouble shooting

如果遇到S3 error: The specified bucket does not exist

解决方法：把/usr/local/lib/node_modules/aws-cdk/lib/api/bootstrap-environment.js 的{ "Fn::GetAtt": ["StagingBucket", "DomainName"] }中的DomainName改为RegionalDomainName