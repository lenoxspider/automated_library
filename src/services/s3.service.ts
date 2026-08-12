import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand
} from '@aws-sdk/client-s3';
import logger from '../config/logger';
import { requireEnv } from '../config/requireEnv';

const bucketName = process.env.S3_BUCKET_NAME || 'book-covers';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY')
  },
  forcePathStyle: true // Mandatory for MinIO local host setup
});

let initialized = false;

/**
 * Initializes the MinIO bucket: checks if it exists, creates it if missing,
 * and configures public read access policies.
 */
async function ensureBucketExists() {
  if (initialized) return;

  try {
    // 1. Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    initialized = true;
    logger.info(`MinIO bucket "${bucketName}" ready.`);
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      logger.info(`MinIO bucket "${bucketName}" not found. Creating...`);
      try {
        // 2. Create the bucket
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));

        // 3. Set public read policy
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicRead',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`]
            }
          ]
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(policy)
          })
        );

        initialized = true;
        logger.info(
          `MinIO bucket "${bucketName}" created and configured with public-read permissions.`
        );
      } catch (createErr) {
        logger.error({ err: createErr }, 'Failed to create and configure MinIO bucket');
      }
    } else {
      logger.error({ err }, 'Failed to verify MinIO bucket existence');
    }
  }
}

/**
 * Uploads a buffer to the local MinIO bucket and returns its public URL
 */
export async function uploadCover(
  bookId: number | string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucketExists();

  const fileExtension = contentType === 'image/png' ? 'png' : 'jpg';
  const key = `covers/${bookId}/${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExtension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );

  const publicUrlPrefix = process.env.S3_PUBLIC_URL_PREFIX || `http://localhost:9000/${bucketName}`;
  return `${publicUrlPrefix}/${key}`;
}
