import { draftMode } from 'next/headers'

export async function GET(): Promise<Response> {
  try {
    const draft = await draftMode()
    draft.disable()
  } catch (error) {
    console.error('Error disabling draft mode:', error)
  }
  return new Response('Draft mode is disabled')
}
