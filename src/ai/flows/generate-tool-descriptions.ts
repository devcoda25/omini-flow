'use server';

/**
 * @fileOverview Generates tool descriptions for nodes in the properties panel using AI.
 *
 * - generateToolDescription - A function that generates a tool description based on the node type.
 * - GenerateToolDescriptionInput - The input type for the generateToolDescription function.
 * - GenerateToolDescriptionOutput - The return type for the generateToolDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateToolDescriptionInputSchema = z.object({
  nodeType: z.string().describe('The type of the selected node.'),
});
export type GenerateToolDescriptionInput = z.infer<typeof GenerateToolDescriptionInputSchema>;

const GenerateToolDescriptionOutputSchema = z.object({
  description: z.string().describe('A description of the tool and its applicability.'),
});
export type GenerateToolDescriptionOutput = z.infer<typeof GenerateToolDescriptionOutputSchema>;

export async function generateToolDescription(input: GenerateToolDescriptionInput): Promise<GenerateToolDescriptionOutput> {
  return generateToolDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateToolDescriptionPrompt',
  input: {schema: GenerateToolDescriptionInputSchema},
  output: {schema: GenerateToolDescriptionOutputSchema},
  prompt: `You are an AI assistant designed to explain the purpose and applicability of different workflow nodes based on their type.

  Given the following node type:
  {{nodeType}}

  Generate a concise description explaining its function, potential use cases, and any relevant context or considerations. If you know of relevant online documentation or standards documents, extract a relevant portion and summarize its applicability.
  The output should be a single paragraph.
  `,
});

const generateToolDescriptionFlow = ai.defineFlow(
  {
    name: 'generateToolDescriptionFlow',
    inputSchema: GenerateToolDescriptionInputSchema,
    outputSchema: GenerateToolDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
