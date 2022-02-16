import prompts, { PromptType } from 'prompts'
import { TypeOfArray } from './utils'

export async function ask<T extends string = string>(type: PromptType, question: prompts.ValueOrFunc<string>, options?: Partial<prompts.PromptObject<T>>, onCancel = () => {
  process.exit(2)
}) {
  // @ts-ignore
  const { answer } = await prompts(Object.assign({
    type: type,
    name: 'answer',
    message: question,
  }, options), {
    onCancel
  })
  return answer
}

export async function confirm(question, initial) {
  return ask('confirm', question, { initial })
}

export async function text(question, initial) {
  return ask('text', question, { initial })
}

export async function choose(question: string, chooseList: prompts.Choice[], initial?: TypeOfArray<typeof chooseList>) {
  let initialIndex = 0
  if (initial != null) {
    initialIndex = chooseList.indexOf(initial)
    if (initialIndex === -1) {
      chooseList = [initial, ...chooseList]
      initialIndex = 0
    }
  }
  return ask('select', question, {
    initial: initialIndex,
    choices: chooseList,
  })
}
