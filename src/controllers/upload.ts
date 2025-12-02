import { FastifyReply } from 'fastify'
import { uploadBufferToBucket } from '../services/storageService'
import { MultipartRequest } from '../types/types'
import { isPdf } from '../utils/utils'
import toHttpError from '../utils/toHttpError'
import { env } from '../config/env'
import { prisma } from '../db/client'

export async function uploadApplicationController (
  req: MultipartRequest<{ type: 'hsc' | 'sslc' }>,
  reply: FastifyReply
) {
  try {
    const ct = (req.headers['content-type'] || '') as string
    console.log('ct', ct)
    if (!ct.startsWith('multipart/form-data'))
      return reply.code(406).send({ message: 'Invalid content type' })
    const checkUser = await prisma.users.findUnique({
      where: {
        ref_id: req.user?.sub
      }
    })
    if (!checkUser) {
      return reply.code(401).send({ message: 'Unauthorized' })
    }

    const part = await req.file()
    if (!part) return reply.code(400).send({ message: 'No file provided' })

    const head = await part.toBuffer()
    if (!isPdf(part.mimetype, part.filename, head)) {
      return reply.code(400).send({ message: 'Only PDF files are allowed' })
    }

    const userId = req.user?.sub
    const path = `${userId}/application/${
      req.params.type
    }/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${part.filename.replace(/[^\w.\-]+/g, '_')}`

    const result = await uploadBufferToBucket(
      req.server,
      env.SUPABASE_BUCKET,
      path,
      head,
      'application/pdf'
    )

    if (!result) {
      return reply.code(500).send({ message: 'File upload failed' })
    }

    return reply.send({
      message: 'File uploaded successfully',
      path: result.path,
      signedUrl: result.signedUrl
    })
  } catch (e: any) {
    console.log('updateUserProfile error --------- ', e)

    const { status, payload } = toHttpError(e)
    return reply.status(status).send(payload)
  }
}

export async function uploadAccountController (
  req: MultipartRequest<{ type: string }>,
  reply: FastifyReply
) {
  try {
    const ct = (req.headers['content-type'] || '') as string
    console.log('ct', ct)
    if (!ct.startsWith('multipart/form-data'))
      return reply.code(406).send({ message: 'Invalid content type' })
    const checkUser = await prisma.users.findUnique({
      where: {
        ref_id: req.user?.sub
      }
    })
    if (!checkUser) {
      return reply.code(401).send({ message: 'Unauthorized' })
    }

    const part = await req.file()
    if (!part) return reply.code(400).send({ message: 'No file provided' })

    const head = await part.toBuffer()
    if (!isPdf(part.mimetype, part.filename, head)) {
      return reply.code(400).send({ message: 'Only PDF files are allowed' })
    }

    const userId = req.user?.sub
    const path = `${userId}/account/${
      req.params.type
    }/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${part.filename.replace(/[^\w.\-]+/g, '_')}`

    const result = await uploadBufferToBucket(
      req.server,
      env.SUPABASE_BUCKET,
      path,
      head,
      'application/pdf'
    )

    if (!result) {
      return reply.code(500).send({ message: 'File upload failed' })
    }
    const key = req.params.type === 'hsc' ? 'hsc_path' : 'sslc_path'

    await prisma.users.update({
      where: {
        ref_id: userId
      },
      data: {
        [key]: result.path
      }
    })

    return reply.send({
      message: 'File uploaded successfully',
      path: result.path,
      signedUrl: result.signedUrl
    })
  } catch (e: any) {
    console.log('updateUserProfile error --------- ', e)

    const { status, payload } = toHttpError(e)
    return reply.status(status).send(payload)
  }
}
