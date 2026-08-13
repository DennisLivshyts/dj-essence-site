import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { isValidGalleryPassword } from '@/lib/galleryStore'
import {
  archiveReview,
  deleteArchived,
  deletePending,
  isValidReviewId,
  putPending,
  readApproved,
  readArchivedById,
  readPendingById,
  writeApproved,
} from '@/lib/reviewStore'
import { MIN_REVIEW_TEXT, REVIEW_LIMITS, type Review } from '@/lib/reviewTypes'

/**
 * Every moderation mutation, behind one auth check.
 *
 * Deliberately ONE route with an `action` switch instead of the six separate
 * routes the original spec listed. They would have been six copies of the same
 * rate-limit + password + id-validation preamble, and copy-pasted auth across
 * gallery routes is exactly what pushed lib/rateLimit.ts and lib/galleryStore.ts
 * into existence in the first place. The actions share an auth model completely.
 */

type Action = 'approve' | 'reject' | 'unpublish' | 'purge' | 'edit' | 'reorder'
const ACTIONS: Action[] = ['approve', 'reject', 'unpublish', 'purge', 'edit', 'reorder']

export async function POST(request: Request) {
  if (!checkRateLimit('reviews-moderate', getClientIp(request), 60, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { password?: unknown; action?: unknown; id?: unknown; text?: unknown; order?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!isValidGalleryPassword(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const action = body.action
  if (typeof action !== 'string' || !ACTIONS.includes(action as Action)) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 422 })
  }

  // Reorder is the one action keyed by a list rather than a single id.
  if (action === 'reorder') {
    if (!Array.isArray(body.order) || !body.order.every(isValidReviewId)) {
      return NextResponse.json({ error: 'Invalid order' }, { status: 422 })
    }
    try {
      const approved = await readApproved()
      const byId = new Map(approved.map(r => [r.id, r]))
      const next: Review[] = []
      for (const id of body.order as string[]) {
        const r = byId.get(id)
        if (r) {
          next.push(r)
          byId.delete(id)
        }
      }
      // Anything the client didn't mention keeps its place at the end rather than
      // being dropped — a stale tab must not be able to delete reviews by omission.
      next.push(...byId.values())
      await writeApproved(next)
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('Review reorder error:', err)
      return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 })
    }
  }

  if (!isValidReviewId(body.id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 422 })
  }
  const id = body.id

  try {
    switch (action) {
      case 'approve': {
        const review = await readPendingById(id)
        if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const approved = await readApproved()
        // Guard against a double-click publishing the same review twice.
        const next = [
          { ...review, approvedAt: new Date().toISOString() },
          ...approved.filter(r => r.id !== id),
        ]
        // Manifest first: if this throws, the review is still safely pending rather
        // than deleted from both places.
        await writeApproved(next)
        await deletePending(id)
        return NextResponse.json({ ok: true })
      }

      case 'reject': {
        const review = await readPendingById(id)
        if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        // Archived, never deleted. A bad review is the most useful thing he'll read
        // all month and it stays readable to him privately.
        await archiveReview(review)
        await deletePending(id)
        return NextResponse.json({ ok: true })
      }

      case 'unpublish': {
        const approved = await readApproved()
        const review = approved.find(r => r.id === id)
        if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        await archiveReview(review)
        await writeApproved(approved.filter(r => r.id !== id))
        return NextResponse.json({ ok: true })
      }

      case 'purge': {
        const review = await readArchivedById(id)
        if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        await deleteArchived(id)
        return NextResponse.json({ ok: true })
      }

      case 'edit': {
        // Typo fixes only — see the legal note in the spec. Rewriting sentiment is
        // putting words in someone's mouth; the UI says so and this only accepts text.
        const text = typeof body.text === 'string' ? body.text.trim() : ''
        if (text.length < MIN_REVIEW_TEXT || text.length > REVIEW_LIMITS.text) {
          return NextResponse.json(
            { error: `Review text must be ${MIN_REVIEW_TEXT}–${REVIEW_LIMITS.text} characters` },
            { status: 422 }
          )
        }

        const pending = await readPendingById(id)
        if (pending) {
          await putPending({ ...pending, text })
          return NextResponse.json({ ok: true })
        }

        const approved = await readApproved()
        if (approved.some(r => r.id === id)) {
          await writeApproved(approved.map(r => (r.id === id ? { ...r, text } : r)))
          return NextResponse.json({ ok: true })
        }

        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }
  } catch (err) {
    console.error(`Review ${action} error:`, err)
    return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 422 })
}
