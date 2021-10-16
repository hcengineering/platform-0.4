import core, { Client, generateDocumentDiff, Ref, TxOperations } from '@anticrm/core'
import { FSM, State } from '@anticrm/fsm'
import recrutting, { Candidate, CandidatePoolSpace, CandidateStatus } from '@anticrm/recruiting'
import { TrelloBoard } from './trello'

function getName (name: string): {
  firstName: string
  lastName: string
  prefix?: string
  postFix?: string
  orig: string
} {
  const sp = name.trim().split(',')
  if (sp.length === 1) {
    const ss = (sp[0] ?? '').trim().split(' ')
    return { firstName: (ss[0] ?? '').trim(), lastName: (ss[1] ?? '').trim(), orig: name }
  }
  if (sp.length === 2) {
    let ss = (sp[0] ?? '').trim().split(' ')
    if (!Number.isNaN(Number.parseInt(ss[0]))) {
      // It is number
      ss = (sp[1] ?? '').trim().split(' ')
      return {
        firstName: (ss[0] ?? '').trim(),
        lastName: (ss[1] ?? '').trim(),
        prefix: (sp[0] ?? '').trim(),
        orig: name
      }
    }
    return {
      firstName: (ss[0] ?? '').trim(),
      lastName: (ss[1] ?? '').trim(),
      postFix: (sp[1] ?? '').trim(),
      orig: name
    }
  }
  if (sp.length >= 3) {
    const ss = (sp[1] ?? '').trim().split(' ')
    return {
      firstName: (ss[0] ?? '').trim(),
      lastName: (ss[1] ?? '').trim(),
      postFix: (sp.slice(2).join(', ') ?? '').trim(),
      prefix: (sp[0] ?? '').trim(),
      orig: name
    }
  }
  console.info(name)
  return { firstName: name, lastName: '', orig: name }
}

export async function createUpdateCandidates (
  client: Client & TxOperations,
  candPoolId: Ref<CandidatePoolSpace>,
  board: TrelloBoard
): Promise<{
    candidates: Candidate[]
    candidateStates: Map<Ref<Candidate>, { state: Ref<State>, pos: number }>
  }> {
  const allCandidates = new Map<Ref<Candidate>, Candidate>(
    Array.from(await client.findAll(recrutting.class.Candidate, { space: candPoolId })).map((c) => [c._id, c])
  )
  const states = new Map<Ref<Candidate>, { state: Ref<State>, pos: number }>()
  const clientId = await client.accountId()
  for (const c of board.cards) {
    const cid = c.id as Ref<Candidate>
    const { firstName, lastName } = getName(c.name)

    states.set(cid, { state: c.idList as Ref<State>, pos: c.pos })

    const data: Candidate = {
      _id: cid,
      _class: recrutting.class.Candidate,
      space: candPoolId,
      modifiedOn: Date.now(),
      modifiedBy: clientId,
      createOn: Date.now(),
      // Data values
      firstName,
      lastName,
      email: '',
      address: {},
      employment: {
        position: '',
        experience: 0
      },
      resume: '',
      status: CandidateStatus.AvailableForHire
    }
    const cand = allCandidates.get(cid)
    if (cand === undefined) {
      // New candidate let's add it.
      await client.createDoc<Candidate>(recrutting.class.Candidate, candPoolId, data, cid)
    } else {
      // Perform update, in case values are different.
      for (const t of generateDocumentDiff([cand], [data])) {
        await client.tx(t)
      }
    }
  }
  return {
    candidates: await client.findAll(recrutting.class.Candidate, { space: candPoolId }),
    candidateStates: states
  }
}

export async function createCandidatePool (
  fsmId: Ref<FSM>,
  client: Client & TxOperations,
  board: TrelloBoard
): Promise<Ref<CandidatePoolSpace>> {
  const candPoolId = ('cand.' + fsmId) as Ref<CandidatePoolSpace>
  const candidatePool = await client.findAll(recrutting.class.CandidatePoolSpace, { _id: candPoolId })
  const clientId = await client.accountId()
  if (candidatePool.length === 0) {
    // Create candidate Pool
    await client.createDoc(
      recrutting.class.CandidatePoolSpace,
      core.space.Model,
      {
        name: board.name,
        description: '',
        private: false,
        members: [clientId]
      },
      candPoolId
    )
  } else {
    if (!Array.from(candidatePool[0].members).includes(clientId)) {
      await client.updateDoc(candidatePool[0]._class, candidatePool[0].space, candPoolId, {
        $push: { members: clientId }
      })
    }
  }
  return candPoolId
}
