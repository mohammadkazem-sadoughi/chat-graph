import json
import requests
import time
from functools import wraps
import logging
import os

def retry():
    def decorator_retry(func):
        @wraps(func)
        def wrapper_retry(self, *args, **kwargs):
            tries = 0
            while tries < self.max_tries:
                try:
                    output = func(self, *args, **kwargs)
                    return output
                except Exception as e:
                    tries += 1
                    if tries >= self.max_tries:
                        raise Exception(f"Failed after {self.max_tries} attempts due to error: {str(e)}")
                    logging.error(f"Attempt {tries} failed with error: {str(e)}. Retrying in {self.delay} seconds...")
                    time.sleep(self.delay)
            raise Exception(f"Failed after {self.max_tries} attempts")
        return wrapper_retry
    return decorator_retry

class LLM:
    model_message_lengths = {}
    model_output_lengths = {}
    
    def __init__(self, model="phi3:3.8b") -> None:
        self.model = model
        self.max_tries = 3
        self.delay = 1
        if model not in LLM.model_message_lengths:
            LLM.model_message_lengths[model] = 0
            LLM.model_output_lengths[model] = 0

    @retry()
    def _call_llm(self, messages, stop=None) -> str:
        """
        Calls the LLM API and returns the complete response content.
        """
        try:
            response = requests.post(
                "http://0.0.0.0:11434/api/chat",
                json={"model": self.model, "messages": messages, "stream": True},
                stream=True
            )
            response.raise_for_status()

            output = ""
            for line in response.iter_lines():
                if line:
                    body = json.loads(line)
                    if "error" in body:
                        raise Exception(body["error"])
                    if body.get("done") is False:
                        message = body.get("message", {})
                        content = message.get("content", "")
                        output += content
                    if body.get("done", False):
                        return output
            return output
        except Exception as e:
            logging.error(f"Error while calling LLM API: {str(e)}")
            raise e

    def call(self, messages, stop=None, store=False, agent=None, iteration=None) -> str:
        """
        Wrapper function to handle LLM calls with retry and logging capabilities.
        """
        response_content = self._call_llm(messages, stop)
        
        if store and iteration is not None and agent is not None:
            os.makedirs(f'logs/{agent}', exist_ok=True)
            with open(f'logs/{agent}/prompt_{iteration}.txt', 'w') as f:
                f.write("\n ----- \n".join(message['content'] for message in messages))
            with open(f'logs/{agent}/response_{iteration}.txt', 'w') as f:
                f.write(response_content)
        
        # Update token usage stats
        LLM.model_message_lengths[self.model] += sum(len(message['content']) for message in messages) / 4.0
        LLM.model_output_lengths[self.model] += len(response_content) / 4.0 if response_content else 0
        logging.info(f"Model ({self.model}) Usage: Input tokens: {LLM.model_message_lengths[self.model]:.2f} Output tokens: {LLM.model_output_lengths[self.model]:.2f}")
        
        return response_content
