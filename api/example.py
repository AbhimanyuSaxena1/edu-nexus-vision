import requests
import json

# The base URL where your FastAPI application is running
BASE_URL = "http://127.0.0.1:8000"


def get_explanation(topic: str):
    """
    Sends a request to the /explain endpoint to get an explanation for a topic.
    """
    url = f"{BASE_URL}/explain"
    payload = {"topic": topic}
    print(f"--- Requesting explanation for: '{topic}' ---")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # Raises an exception for 4XX/5XX errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None


def get_test(thread_id: str):
    """
    Sends a request to the /create_test endpoint using a specific thread_id.
    """
    url = f"{BASE_URL}/create_test"
    payload = {"thread_id": thread_id}
    print(f"\n--- Requesting a test for thread_id: {thread_id} ---")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None


def run_test_flow():
    """
    Executes the full workflow:
    1. Gets an explanation for a topic.
    2. Extracts the thread_id.
    3. Requests a test for that thread.
    """
    # 1. Get an explanation
    topic_to_explain = "Newton's First Law of Motion"
    explanation_response = get_explanation(topic_to_explain)

    if not explanation_response:
        print("Failed to get an explanation. Aborting.")
        return

    print("\n--- Explanation Response ---")
    print(json.dumps(explanation_response, indent=2))

    # 2. Extract the thread_id
    thread_id = explanation_response.get("thread_id")
    if not thread_id:
        print("Could not find 'thread_id' in the response. Aborting test creation.")
        return

    # 3. Request a test using the thread_id
    test_response = get_test(thread_id)

    if not test_response:
        print("Failed to get a test.")
        return

    print("\n--- Test Creation Response ---")
    print(json.dumps(test_response, indent=2))


if __name__ == "__main__":
    # To run this script:
    # 1. Make sure the FastAPI server is running:
    #    uvicorn ai_tutor:app --reload
    # 2. Open a new terminal and run this file:
    #    python test_client.py
    run_test_flow()
