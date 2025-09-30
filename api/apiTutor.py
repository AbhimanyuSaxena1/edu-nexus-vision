# ai_tutor_backend.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from typing import Optional, List, Dict, Any

# --- Environment Variable (for security) ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE") # Replace with your actual key

# --- Initialize FastAPI App ---
app = FastAPI(title="AI Tutor Backend")

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",  # Frontend running locally
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for API Validation ---
class TutorRequest(BaseModel):
    # The frontend is now sending the user's input under this field:
    topic: str 
    thread_id: Optional[str] = None 

# --- LangGraph Agent Initialization ---
# Initialize model (ensure GROQ_API_KEY is set)
model = ChatGroq(
    model="mixtral-8x7b-32768", # A reliable Groq model
    api_key=GROQ_API_KEY,
)

# Create memory checkpointer
memory = MemorySaver()

# Helper function to invoke an agent and return its raw message content.
def get_agent_raw_response(agent, message: str, thread_id: Optional[str] = None) -> str:
    """Helper function to invoke an agent and return its raw string response."""
    thread_id = thread_id if thread_id else "default_thread" 
    config = {"configurable": {"thread_id": thread_id}}
    
    response = agent.invoke({"messages": [("user", message)]}, config)
    
    # LangGraph response structure
    return response["messages"][-1].content


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
    "A relevant example to help understanding."
  ],
  "understanding_check": "A question like 'Does that make sense? Would you like me to create a short test on this topic for you?'"
}

Important Rules:
- You must respond ONLY with the JSON object. Do not include any text, pleasantries, or markdown wrappers like ```json at the beginning or end.
- Ensure the JSON is perfectly formatted.
- The explanation should be tailored to a beginner's level unless the user specifies otherwise.
""",
    checkpointer=memory,
    name="AITutor",
)

# --- Agent 2: The Test Creator (Not used in the primary flow, but kept for context) ---
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
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "The correct option"
    }
  ]
}

Important Rules:
- You must respond ONLY with the JSON object. No other text.
- Ensure the JSON is perfectly formatted.
- Create 2-4 questions.
- Include at least one 'multiple_choice' and one 'open_ended' question.
""",
    checkpointer=memory,
    name="TestCreator",
)


# --- FastAPI Endpoint ---

@app.post("/explain")
async def explain_topic(request: TutorRequest):
    """
    Handles the request from the frontend to explain a specific topic.
    """
    try:
        # 1. Invoke the AI Tutor Agent
        ai_message_raw = get_agent_raw_response(
            ai_tutor, 
            request.topic, 
            request.thread_id
        )

        # 2. Parse the JSON response from the agent
        try:
            # Clean up the raw response (removes ```json...``` wrapping if present)
            cleaned_json_str = ai_message_raw.strip().replace("```json", "").replace("```", "")
            parsed_json = json.loads(cleaned_json_str)

        except json.JSONDecodeError:
            # Handle cases where the agent returns invalid JSON
            print(f"JSON Decode Error. Raw Content: {ai_message_raw}")
            # Raise an error to the frontend so it knows the response is invalid
            raise HTTPException(
                status_code=500,
                detail=f"AI agent returned malformed JSON: {ai_message_raw[:100]}..."
            )

        # 3. Format the structured response into a readable string (Markdown)
        
        # Start with the main explanation (bolded)
        full_response_parts = [
            f"**{parsed_json.get('explanation', 'No explanation provided.')}**"
        ]
        
        # Add examples as a markdown list
        examples: List[str] = parsed_json.get('examples', [])
        if examples:
            full_response_parts.append("\n\nExamples:")
            for example in examples:
                full_response_parts.append(f"- {example}")

        # Add the understanding check question
        understanding_check = parsed_json.get('understanding_check', 'Do you have any follow-up questions?')
        full_response_parts.append(f"\n\n---\n\n{understanding_check}")
        
        final_answer = "\n".join(full_response_parts)

        # 4. Return the final formatted answer to the frontend
        return {"answer": final_answer}

    except HTTPException:
        # Re-raise explicit HTTP exceptions
        raise
    except Exception as e:
        print(f"Internal Server Error: {e}")
        # Catch all other errors and return a 500
        raise HTTPException(status_code=500, detail="Internal server error while processing request.")