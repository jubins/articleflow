// Cloudflare R2 storage service for uploading images
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import crypto from 'crypto'

export interface R2UploadOptions {
  buffer: Buffer
  contentType: string
  fileName?: string
  folder?: string
}

export interface R2UploadResult {
  url: string
  key: string
  bucket: string
}

export class R2StorageService {
  private client: S3Client
  private bucketName: string
  private publicUrl: string

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    this.bucketName = process.env.R2_BUCKET_NAME || 'articlegpt'
    this.publicUrl = process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.')
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  /**
   * Upload a file to R2
   */
  async upload(options: R2UploadOptions): Promise<R2UploadResult> {
    const { buffer, contentType, fileName, folder } = options

    // Generate a unique key
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const extension = contentType.split('/')[1] || 'bin'
    const name = fileName || `file-${timestamp}-${randomString}.${extension}`
    const key = folder ? `${folder}/${name}` : name

    try {
      // Use Upload for better handling of large files
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
      })

      await upload.done()

      // Return the public URL
      const url = `${this.publicUrl}/${key}`

      return {
        url,
        key,
        bucket: this.bucketName,
      }
    } catch (error) {
      console.error('R2 upload error:', error)
      throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload an image from a URL
   */
  async uploadFromUrl(imageUrl: string, options: { folder?: string; fileName?: string }): Promise<R2UploadResult> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = response.headers.get('content-type') || 'image/png'

      return await this.upload({
        buffer,
        contentType,
        fileName: options.fileName,
        folder: options.folder,
      })
    } catch (error) {
      console.error('R2 upload from URL error:', error)
      throw new Error(`Failed to upload image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload multiple files in parallel
   */
  async uploadBatch(files: R2UploadOptions[]): Promise<R2UploadResult[]> {
    try {
      const uploads = files.map(file => this.upload(file))
      return await Promise.all(uploads)
    } catch (error) {
      console.error('R2 batch upload error:', error)
      throw new Error(`Failed to upload batch: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
