import { Conversation, z, adk, Autonomous } from '@botpress/runtime'
import { KnowledgeDocs } from '../knowledge/docs'
import { makeGuardrails } from './extensions/guardrails'
import { isSimpleGreeting, greetingReply } from '../utils/greetings'
import { reportUnanswered } from '../tools/reportUnanswered'
import { sanitizeAnswer } from '../utils/sanitizeAnswer'

const AnswerExit = new Autonomous.Exit({
  name: 'answer',
  description: 'Call this when you have a final answer ready for the user.',
  schema: z.object({
    answer: z
      .string()
      .describe('Your complete formatted answer in markdown. Use code blocks only for actual code examples.'),
  }),
})

const OffTopicExit = new Autonomous.Exit({
  name: 'offTopic',
  description: 'Call this when the user asks something unrelated to Botpress or off-topic.',
  schema: z.object({
    message: z
      .string()
      .describe(
        'A polite redirect message explaining you only handle Botpress questions and suggesting where they might find help.'
      ),
  }),
})

export default new Conversation({
  channel: ['webchat.channel'],
  handler: async ({ execute, state, message, conversation, client }) => {
    let messageText = ''

    if (message && message.direction === 'incoming' && conversation.tags.hasMessages === undefined)
      conversation.tags.hasMessages = 'true'

    if (
      message?.payload &&
      'type' in message.payload &&
      message.payload.type === 'text' &&
      'value' in message.payload &&
      message.payload.value
    ) {
      const parsed = JSON.parse(message.payload.value)
      const contextToAdd = parsed.currentContext?.map((item: { title: string; path: string }) => item.path) || []

      if ('text' in message.payload) {
        messageText = message.payload.text
      }

      if (contextToAdd.length > 0) {
        state.context = contextToAdd
        conversation.send({
          type: 'custom',
          payload: { url: '', name: 'Reading context...' },
        })
      } else {
        conversation.send({
          type: 'custom',
          payload: { url: '', name: 'Thinking...' },
        })
      }
    }

    if (!messageText) {
      await conversation.send({
        type: 'text',
        payload: {
          text: 'Send me a text question about Botpress and I can help.',
        },
      })
      return
    }

    if (isSimpleGreeting(messageText)) {
      await conversation.send({
        type: 'text',
        payload: { text: greetingReply() },
      })
      return
    }

    const guardrails = makeGuardrails(async () => {
      conversation.send({
        type: 'custom',
        payload: { url: '', name: `Searching documentation...` },
      })
    })

    const result = await execute({
      instructions: `You are the AI Assistant for the Botpress documentation. Give concise, accurate answers to all user questions. Use markdown with subheadings to format your answers (use code blocks for code).

## Role
You help users with questions about Botpress products, including the Agent Development Kit (ADK), Botpress Studio, Cloud platform, integrations, and the Botpress documentation itself.

## Current user question
Answer this exact question: ${JSON.stringify(messageText)}

## How to answer
- Always search the knowledge base before answering. Base your responses only on what you find there.
- Never make up or guess information. If the knowledge base does not contain the answer, use the reportUnanswered tool and let the user know.
- Include code examples when they help clarify. Use TypeScript and follow ADK conventions for ADK questions.
- Keep responses clear and practical. Be friendly but not over-the-top.
- When relevant, mention which ADK primitive or file location applies (e.g. "this goes in src/tools/").
- If the knowledge base provides a screenshot URL for a UI feature, include it inline in your answer using markdown: ![description](url).
- Never link to raw.githubusercontent.com or any skills reference URL. Only link to botpress.com/docs pages.
- Do not add any "References", "Sources", "Key references used", or similar section at the end of your answer.

## When you don't know
If you search the knowledge base and cannot find a confident answer:
1. Call the reportUnanswered tool with the user's question.
2. Let the user know: "I don't have a solid answer for that one. I've flagged it for the team — they'll follow up with an answer."

## Scope
- Only answer questions related to Botpress and its products.
- If someone asks something off-topic, use the offTopic exit with a polite redirect explaining you're here specifically for Botpress help and suggesting where they might find what they need. Do NOT use the reportUnanswered tool for off-topic questions — only report genuine Botpress questions you couldn't answer.

## Context
If there are any pages in ${JSON.stringify(state.context)}, prioritize them when generating your answer.
`,
      knowledge: [KnowledgeDocs],
      model: 'auto',
      tools: [reportUnanswered],
      exits: [AnswerExit, OffTopicExit],
      mode: 'worker',
      hooks: guardrails,
    })

    if (result.is(OffTopicExit)) {
      await conversation.send({
        type: 'text',
        payload: { text: result.output.message },
      })
      return
    }

    if (!result.is(AnswerExit)) {
      await conversation.send({
        type: 'text',
        payload: {
          text: 'I ran into an issue processing that. Could you try rephrasing your question?',
        },
      })
      return
    }

    const answer = sanitizeAnswer(result.output.answer)
    await conversation.send({
      type: 'text',
      payload: { text: answer },
    })

    if (!conversation.tags.chatSummaryTitle) {
      let title: string
      try {
        title = await adk.zai.rewrite(
          answer,
          'Use this message to generate a summary of the chat as a 1-5 word title without punctuation. Use sentence case',
          { length: 15 }
        )
        title = title.trim().slice(0, 50)
      } catch {
        title = answer.slice(0, 30) + (answer.length > 30 ? '...' : '')
      }

      conversation.tags.chatSummaryTitle = title

      await client.callAction({
        type: 'webchat:customEvent',
        input: {
          conversationId: conversation.id,
          event: JSON.stringify({ type: 'conversationTitle', title }),
        },
      })
    }

    state.context = []
  },
  state: z.object({
    context: z.array(z.string()),
  }),
})
