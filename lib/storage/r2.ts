import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export interface UploadResult {
  url: string
  key: string
}

/**
 * Upload a buffer to R2 storage
 */
export async function uploadToR2(
  buffer: Buffer,
  contentType: string,
  folder: string = 'diagrams'
): Promise<UploadResult> {
  const key = `${folder}/${uuidv4()}.webp`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await r2Client.send(command)

  const url = `${process.env.R2_PUBLIC_URL}/${key}`

  return { url, key }
}

/**
 * Upload a Mermaid diagram image to R2
 */
export async function uploadMermaidDiagram(buffer: Buffer): Promise<string> {
  const result = await uploadToR2(buffer, 'image/webp', 'diagrams')
  return result.url
}
