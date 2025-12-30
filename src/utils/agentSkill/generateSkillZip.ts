import JSZip from 'jszip';
import { dedent } from 'ts-dedent';

export type GenerateSkillZipParams = {
  agentId: string;
  agentName: string;
  slug: string;
  description: string;
  queryEndpoint: string;
  token: string;
};

/**
 * Generate a skill manifest for Claude Code
 */
const generateSkillManifest = (params: GenerateSkillZipParams) => {
  const { agentName, slug, description } = params;
  return {
    name: slug,
    description: `${agentName}: ${description || 'Knowledge base agent'}`,
    version: '1.0.0',
  };
};

/**
 * Generate the skill markdown content
 */
const generateSkillContent = (params: GenerateSkillZipParams) => {
  const { agentName, description, queryEndpoint, token } = params;
  return dedent`
    ---
    description: Query the ${agentName} knowledge base for information
    ---

    # ${agentName}

    ${description || 'Query this knowledge base for information.'}

    ## Usage

    Use WebFetch to query the knowledge base:

    \`\`\`
    POST ${queryEndpoint}
    Authorization: Bearer ${token}
    Content-Type: application/json

    {
      "query": "your question here"
    }
    \`\`\`

    ## Response

    The API returns a JSON response with the following structure:

    \`\`\`json
    {
      "answer": "The answer to your question based on the knowledge base",
      "sources": ["list of source documents used"]
    }
    \`\`\`
  `;
};

/**
 * Generate a ZIP file containing the skill configuration
 */
export const generateSkillZip = async (params: GenerateSkillZipParams): Promise<Blob> => {
  const zip = new JSZip();

  // Add skill manifest
  const manifest = generateSkillManifest(params);
  zip.file('skill.json', JSON.stringify(manifest, null, 2));

  // Add skill content
  const content = generateSkillContent(params);
  zip.file(`${params.slug}.md`, content);

  // Generate the ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
