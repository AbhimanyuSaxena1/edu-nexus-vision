# aiTutor.py
import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

class AiTutor:
    def __init__(self, model="gpt-4o-mini", system_role="You are an AI tutor. Explain concepts clearly and give examples."):
        self.model = model
        self.system_role = system_role

    def ask(self, question: str) -> str:
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_role},
                    {"role": "user", "content": question}
                ],
                temperature=0.7,
                max_tokens=500
            )
            return response["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"Error: {str(e)}"
