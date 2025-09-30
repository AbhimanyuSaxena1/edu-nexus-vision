from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
import os
from pydantic import BaseModel
import json
from env import GROQ_API_KEY
# --- Environment Variable (for security) ---
# It's better practice to load keys from environment variables
# For this example, you can replace "YOUR_GROQ_API_KEY" with your actual key
# or set it as an environment variable named GROQ_API_KEY.

# --- Initialize model ---
# Using a powerful open-source model via Groq for fast responses
model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=GROQ_API_KEY,
)

# --- Create memory ---
# This will save the state of our conversation
memory = MemorySaver()

# --- Agent 1: The AI Tutor ---
# This agent is responsible for explaining topics to the user.
ai_tutor = create_react_agent(
    model=model,
    tools=[],
    prompt="""
You are an expert AI Tutor. Your goal is to explain any given topic clearly and concisely.
Based on the user's request, provide a simple explanation with illustrative examples.
After your explanation, you MUST check if the user has understood.

Your response must be a valid JSON object with the following structure:
{
  "explanation": "A clear and simple explanation of the topic.",
  "examples": [
    "A relevant example to help understanding.",
    "Another relevant example."
  ],
  "understanding_check": "A question like 'Does that make sense? Would you like me to create a short test on this topic for you?'"
}

Example Interaction:
User: "Explain photosynthesis"
Your JSON response:
{
  "explanation": "Photosynthesis is the process used by plants, algae, and some bacteria to convert light energy into chemical energy, through a process that converts carbon dioxide and water into glucose (sugar) and oxygen.",
  "examples": [
    "A tree using sunlight to grow and produce leaves.",
    "Algae in a pond creating oxygen, which helps fish to breathe."
  ],
  "understanding_check": "Does that explanation help? I can create a few questions to test your knowledge if you'd like."
}

Important Rules:
- You must respond ONLY with the JSON object. No other text or pleasantries.
- Ensure the JSON is perfectly formatted.
- The explanation should be tailored to a beginner's level unless the user specifies otherwise.
""",
    checkpointer=memory,
    name="AITutor",
)

# --- Agent 2: The Test Creator ---
# This agent creates a quiz based on the topic explained by the AI Tutor.
test_creator = create_react_agent(
    model=model,
    tools=[],
    prompt="""
You are a Test Creator. Your task is to generate a short quiz based on the conversation history.
The quiz should test the key concepts from the explanation provided by the AI Tutor.

Your response must be a valid JSON object with this structure:
{
  "topic": "The topic of the test",
  "questions": [
    {
      "question_number": 1,
      "question_text": "A question about the topic.",
      "question_type": "multiple_choice",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "The correct option"
    },
    {
      "question_number": 2,
      "question_text": "An open-ended question about the topic.",
      "question_type": "open_ended"
    }
  ]
}

Example Interaction (following the photosynthesis explanation):
User: "Yes, create a test"
Your JSON response:
{
  "topic": "Photosynthesis",
  "questions": [
    {
      "question_number": 1,
      "question_text": "What are the main inputs for photosynthesis?",
      "question_type": "multiple_choice",
      "options": [
        "Oxygen and sugar",
        "Sunlight, water, and carbon dioxide",
        "Sunlight and oxygen",
        "Water and sugar"
      ],
      "correct_answer": "Sunlight, water, and carbon dioxide"
    },
    {
      "question_number": 2,
      "question_text": "In your own words, why is photosynthesis important for life on Earth?",
      "question_type": "open_ended"
    }
  ]
}

Important Rules:
- You must respond ONLY with the JSON object. No other text.
- Ensure the JSON is perfectly formatted.
- Create 2-4 questions.
- Include at least one 'multiple_choice' and one 'open_ended' question.
- The questions must be directly related to the explanation provided earlier in the conversation.
""",
    checkpointer=memory,
    name="TestCreator",
)


class TutorRequest(BaseModel):
    topic: str
    thread_id: str | None = None


class TestRequest(BaseModel):
    thread_id: str
    prompt: str = "Yes, please create a test."


def get_agent_response(agent, message, thread_id):
    """Helper function to invoke an agent and parse its JSON response."""
    config = {"configurable": {"thread_id": thread_id}}
    response = agent.invoke({"messages": [("user", message)]}, config)
    # The response content is in the 'messages' list, typically the last one from the assistant
    ai_message_content = response["messages"][-1].content
    try:
        # The agent should respond with a JSON string, so we parse it
        return json.loads(ai_message_content)
    except json.JSONDecodeError:
        # If parsing fails, return the raw content with an error message
        return {
            "error": "Failed to parse agent's JSON response.",
            "raw_response": ai_message_content,
        }
