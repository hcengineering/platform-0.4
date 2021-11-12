import core, { Account, generateId, getFullRef, Ref } from '@anticrm/core'
import recruiting, {
  Applicant,
  Candidate,
  CandidatePoolSpace,
  CandidateStatus,
  SocialLink,
  VacancySpace
} from '@anticrm/recruiting'
import { component, Component } from '@anticrm/status'
import faker from 'faker'
import { State } from '@anticrm/fsm'
import { accountIds } from './demoAccount'
import { DemoBuilder } from './model'

const demoIds = component('demo-recruiting' as Component, {
  vacancy: {
    DemoVacany: '' as Ref<VacancySpace>
  },
  candidatePool: {
    DemoCandidatePool: '' as Ref<CandidatePoolSpace>
  }
})

/**
 * @public
 */
export async function demoRecruiting (builder: DemoBuilder, candidateCount = 20): Promise<void> {
  const members: Ref<Account>[] = [
    core.account.System,
    ...faker.random.arrayElements(accountIds, faker.datatype.number(accountIds.length))
  ]

  console.error('generate demo recruiting')
  await builder.createDoc(
    recruiting.class.CandidatePoolSpace,
    {
      name: 'DEMO',
      description: 'Demo candidate pool',
      members: members,
      private: false
    },
    demoIds.candidatePool.DemoCandidatePool,
    {
      space: core.space.Model
    }
  )

  await builder.createDoc(
    recruiting.class.VacancySpace,
    {
      name: 'DEMO ' + faker.name.jobType(),
      description: 'Demo vacancy',
      members: members,
      private: false,
      location: faker.address.cityName(),
      dueDate: faker.date.soon().getTime(),
      fsm: recruiting.fsm.DefaultVacancy,
      company: faker.company.companyName()
    },
    demoIds.vacancy.DemoVacany,
    {
      space: core.space.Model
    }
  )

  const states = [
    `${recruiting.fsm.DefaultVacancy}-st-applied`,
    `${recruiting.fsm.DefaultVacancy}-st-hr interview`,
    `${recruiting.fsm.DefaultVacancy}-st-test task`,
    `${recruiting.fsm.DefaultVacancy}-st-technical interview`,
    `${recruiting.fsm.DefaultVacancy}-st-offer`,
    `${recruiting.fsm.DefaultVacancy}-st-contract signing`,
    `${recruiting.fsm.DefaultVacancy}-st-rejected`
  ]

  const socialLinkTypes = [
    'Discord',
    'Email',
    'Facebook',
    'Github',
    'Instagram',
    'Linkedin',
    'Phone',
    'Telegram',
    'Twitter',
    'Vk',
    'Whatsapp',
    'Youtube'
  ]

  for (let i = 0; i < candidateCount; i++) {
    const candidateId: Ref<Candidate> = generateId()
    const socialLinks = faker.random
      .arrayElements(socialLinkTypes, faker.datatype.number(socialLinkTypes.length))
      .map((s) => ({
        type: s,
        link: faker.internet.email()
      })) as SocialLink[]

    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const avatar = faker.image.avatar()
    const city = faker.address.cityName()
    await builder.createDoc(
      recruiting.class.Candidate,
      {
        firstName: firstName,
        lastName: lastName,
        avatar: avatar,
        email: faker.internet.email(),
        bio: '',
        socialLinks: socialLinks,
        status: CandidateStatus.AvailableForHire,
        title: faker.name.jobTitle(),
        comments: [],
        attachments: [],
        applicants: [],
        address: {
          city: city
        },
        workPreference: {
          onsite: faker.datatype.boolean() ? faker.datatype.boolean() : undefined,
          remote: faker.datatype.boolean() ? faker.datatype.boolean() : undefined
        }
      },
      candidateId,
      {
        space: demoIds.candidatePool.DemoCandidatePool
      }
    )
    if (faker.datatype.boolean()) {
      const applicantId: Ref<Applicant> = generateId()

      await builder.createDoc(
        recruiting.class.Applicant,
        {
          recruiter: faker.random.arrayElement(members),
          comments: [],
          attachments: [],
          candidate: getFullRef(candidateId, recruiting.class.Candidate),
          fsm: demoIds.vacancy.DemoVacany,
          state: faker.random.arrayElement(states) as Ref<State>,
          item: candidateId,
          clazz: recruiting.class.Candidate,
          candidateData: {
            firstName: firstName,
            lastName: lastName,
            location: city,
            avatar: avatar
          },
          rank: ''
        },
        applicantId,
        {
          space: demoIds.vacancy.DemoVacany
        }
      )
    }
  }
}
