import { Server, Database, Cloud, User, HardDrive, Globe, Zap, Box } from 'lucide-react';

export const nodeTemplates = [
  { type: 'service', label: 'Service', icon: Server, color: 'blue' },
  { type: 'database', label: 'Database', icon: Database, color: 'green' },
  { type: 'cloud', label: 'Cloud', icon: Cloud, color: 'purple' },
  { type: 'user', label: 'User', icon: User, color: 'orange' },
  { type: 'server', label: 'Server', icon: Server, color: 'slate' },
  { type: 'disk', label: 'Storage', icon: HardDrive, color: 'indigo' },
  { type: 'internet', label: 'Internet', icon: Globe, color: 'cyan' },
  { type: 'junction', label: 'Junction', icon: Zap, color: 'primary' },
  { type: 'group', label: 'Group', icon: Box, color: 'gray' },
] as const;

export const cloudTemplates = [
  { type: 'service', label: 'Lambda', iconStr: 'logos:aws-lambda' },
  { type: 'database', label: 'DynamoDB', iconStr: 'logos:aws-dynamodb' },
  { type: 'database', label: 'RDS/Aurora', iconStr: 'logos:aws-aurora' },
  { type: 'service', label: 'S3', iconStr: 'logos:aws-s3' },
  { type: 'server', label: 'EC2', iconStr: 'logos:aws-ec2' },
  { type: 'service', label: 'API Gateway', iconStr: 'logos:aws-api-gateway' },
  { type: 'service', label: 'CloudFront', iconStr: 'logos:aws-cloudfront' },
  { type: 'service', label: 'Route53', iconStr: 'logos:aws-route53' },
  { type: 'service', label: 'OpenSearch', iconStr: 'logos:aws-open-search' },
  { type: 'service', label: 'Kubernetes', iconStr: 'logos:kubernetes' },
  { type: 'service', label: 'Docker', iconStr: 'logos:docker-icon' },
  { type: 'cloud', label: 'GCP', iconStr: 'logos:google-cloud' },
  { type: 'cloud', label: 'Azure', iconStr: 'logos:microsoft-azure' },
] as const;

export const mongodbTemplates = [
  { type: 'cloud', label: 'Atlas Project', iconStr: 'logos:mongodb-icon' },
  { type: 'database', label: 'Atlas Cluster', iconStr: 'logos:mongodb-icon' },
  { type: 'group', label: 'Replica Set', iconStr: 'logos:mongodb' },
  { type: 'group', label: 'Sharded Cluster', iconStr: 'logos:mongodb' },
  { type: 'server', label: 'Config Server', iconStr: 'logos:mongodb-icon' },
  { type: 'gateway', label: 'mongos Router', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'Atlas Search', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'Vector Search', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'Data Federation', iconStr: 'logos:mongodb-icon' },
  { type: 'storage', label: 'Online Archive', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'App Services', iconStr: 'logos:mongodb-icon' },
  { type: 'queue', label: 'Change Streams', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'Atlas Charts', iconStr: 'logos:mongodb-icon' },
  { type: 'storage', label: 'Continuous Backup', iconStr: 'logos:mongodb-icon' },
  { type: 'firewall', label: 'PrivateLink', iconStr: 'logos:mongodb-icon' },
  { type: 'database', label: 'Database', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'Compass', iconStr: 'logos:mongodb' },
] as const;

export const streamingTemplates = [
  { type: 'queue', label: 'Kafka', iconStr: 'logos:kafka' },
  { type: 'cache', label: 'Redis', iconStr: 'logos:redis' },
  { type: 'service', label: 'Elasticsearch', iconStr: 'logos:elasticsearch' },
] as const;
