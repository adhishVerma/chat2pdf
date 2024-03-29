// create a standalone question from chat-history and the current question
export const STANDALONE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. IF in any case the conversation doesn't relate to the follow up question then IGNORE the chat history while preparing the standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`

// Actual question asked
export const QA_TEMPLATE = `You are an enthusiastic AI assistant that has the access to vector store of an uploaded pdf. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer. ALSO MAKE SURE THAT YOU ANSWER CORRECTLY ACCORDING TO THE GENDER specified if it applies. DO NOT MISMATCH or INFER the genders.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`