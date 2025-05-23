import { reply } from "@/app/api/_utils/reply"
import { MarkdownCodeBlock } from "@/app/api/_utils/MarkdownCodeBlock";

export interface ConceptValidationResults {
  validConcepts: string[]
  invalidConcepts: { term: string; reason: string }[]
}

/**
 * Uses AI to validate if extracted terms are actual domain concepts
 */
export async function validateConcepts(
  extractedTerms: string[],
  codeContext: string,
): Promise<ConceptValidationResults> {
  if (extractedTerms.length === 0) {
    return { validConcepts: [], invalidConcepts: [] }
  }

  const prompt = `
You are an expert software developer analyzing code to identify domain-specific concepts.
Given the following code context and extracted terms, determine which terms are valid domain concepts and which are not.

CODE CONTEXT:
\`\`\`
${codeContext}
\`\`\`

EXTRACTED TERMS:
${extractedTerms.join(", ")}

For each term, determine if it's a valid domain concept or not. A valid domain concept is a term that:
1. Represents a meaningful entity, action, or concept in the business/application domain
2. Is not a generic programming term (like "function", "class", "parameter")
3. Is not a common English word without specific domain meaning
4. Is not a variable name that doesn't represent a domain concept
5. Is not a common programming term without specific domain meaning, like "loop", "array", "controller", "service", "result", etc.

Respond in the following JSON format:
{
  "results": [
    {"term": "term1", "isValid": true, "reason": "Explanation why it's a valid concept"},
    {"term": "term2", "isValid": false, "reason": "Explanation why it's not a valid concept"}
  ]
}
`

  try {
    const text = await reply([{
      role: 'user',
      content: prompt,
    }])

    const response = JSON.parse(MarkdownCodeBlock.from(text)[0].code)
    const validConcepts: string[] = []
    const invalidConcepts: { term: string; reason: string }[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.results.forEach((result: any) => {
      if (result.isValid) {
        validConcepts.push(result.term)
      } else {
        invalidConcepts.push({ term: result.term, reason: result.reason })
      }
    })

    return { validConcepts, invalidConcepts }
  } catch (error) {
    console.error("Error validating concepts with AI:", error)
    // If AI validation fails, return all concepts as valid
    return {
      validConcepts: extractedTerms,
      invalidConcepts: [],
    }
  }
}
