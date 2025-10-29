/**
 * Title Generator Service
 *
 * Automatically generates conversation titles based on the first few messages
 * using LLM to summarize the conversation topic.
 */

import { LLMProvider } from '../llm/LLMProvider';
import { LLMMessage } from '../llm/LLMProvider';
import { getMessagesByConversation } from '../api/messages';
import { getConversation, updateConversation } from '../api/conversations';

/**
 * Generate a title for a conversation based on its messages
 * @param conversationId - The conversation ID
 * @param llmProvider - LLM provider instance
 * @returns The generated title or null if generation failed
 */
export async function generateConversationTitle(
  conversationId: string,
  llmProvider: LLMProvider
): Promise<string | null> {
  try {
    // 1. Check if title already exists (not "New Conversation")
    const { data: conversation } = await getConversation(conversationId);
    if (!conversation) {
      console.warn('Conversation not found:', conversationId);
      return null;
    }

    if (conversation.title && conversation.title !== 'New Conversation') {
      console.log('Conversation already has a custom title:', conversation.title);
      return conversation.title;
    }

    // 2. Get the first few messages (user + assistant exchanges)
    const { data: messages } = await getMessagesByConversation(conversationId, {
      limit: 6, // Get up to 3 exchanges (user + assistant)
      order: 'asc',
    });

    if (!messages || messages.length < 2) {
      console.log('Not enough messages to generate title');
      return null;
    }

    // 3. Format messages for LLM
    const conversationContext = messages
      .map((msg) => {
        const role = msg.role === 'user' ? '用户' : msg.agent_name || '助手';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    // 4. Call LLM to generate title
    const titlePrompt: LLMMessage[] = [
      {
        role: 'system',
        content: `你是一个对话标题生成助手。根据用户和助手的对话内容,生成一个简洁、准确的标题。

要求:
- 标题长度: 10-30个字符
- 准确反映对话的核心主题或用户的需求
- 使用简洁的语言,避免冗余
- 不要包含"关于"、"讨论"等冗余词汇
- 直接描述主题或任务

示例:
对话: "用户: 帮我做一个登录表单"
标题: "创建登录表单"

对话: "用户: 我想了解 React Hooks 的使用"
标题: "React Hooks 使用指南"

对话: "用户: 如何优化网站性能?"
标题: "网站性能优化方案"`,
      },
      {
        role: 'user',
        content: `请为以下对话生成一个简洁的标题（10-30个字符）:\n\n${conversationContext}\n\n只返回标题文本,不要包含任何其他内容。`,
      },
    ];

    const response = await llmProvider.complete(titlePrompt);
    const generatedTitle = response.content.trim();

    // 5. Validate and sanitize title
    if (!generatedTitle || generatedTitle.length < 3) {
      console.warn('Generated title too short:', generatedTitle);
      return null;
    }

    // Limit title length
    const finalTitle = generatedTitle.slice(0, 50);

    console.log('Generated conversation title:', finalTitle);
    return finalTitle;
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return null;
  }
}

/**
 * Check if a conversation should have its title generated
 * @param conversationId - The conversation ID
 * @returns True if title should be generated
 */
export async function shouldGenerateTitle(
  conversationId: string
): Promise<boolean> {
  try {
    // Check conversation exists and has default title
    const { data: conversation } = await getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    // Only generate if title is still "New Conversation"
    if (conversation.title && conversation.title !== 'New Conversation') {
      return false;
    }

    // Check message count (need at least 2 messages: 1 user + 1 assistant)
    const { data: messages } = await getMessagesByConversation(conversationId, {
      limit: 3,
      order: 'asc',
    });

    if (!messages || messages.length < 2) {
      return false;
    }

    // Check if we have at least one user message and one assistant message
    const hasUserMessage = messages.some((msg) => msg.role === 'user');
    const hasAssistantMessage = messages.some((msg) => msg.role === 'assistant');

    return hasUserMessage && hasAssistantMessage;
  } catch (error) {
    console.error('Error checking if should generate title:', error);
    return false;
  }
}

/**
 * Generate and update conversation title
 * @param conversationId - The conversation ID
 * @param llmProvider - LLM provider instance
 * @returns True if title was successfully generated and updated
 */
export async function generateAndUpdateTitle(
  conversationId: string,
  llmProvider: LLMProvider
): Promise<boolean> {
  try {
    // Check if we should generate title
    const should = await shouldGenerateTitle(conversationId);
    if (!should) {
      return false;
    }

    // Generate title
    const title = await generateConversationTitle(conversationId, llmProvider);
    if (!title) {
      return false;
    }

    // Update conversation
    const { error } = await updateConversation(conversationId, { title });
    if (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }

    console.log(`Successfully updated conversation ${conversationId} with title: ${title}`);
    return true;
  } catch (error) {
    console.error('Error in generateAndUpdateTitle:', error);
    return false;
  }
}
