import json
import requests

class LLM:
    def __init__(self, model="phi3:3.8b") -> None:
        self.model = model

    def _call_llm(self, messages, stop=None) -> str:
        """
        Calls the LLM API and returns the complete response content.
        """
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

    def call(self, messages, stop=None, store=False, agent=None, iteration=None) -> str:
        """
        Simple wrapper function to call the LLM API.
        """
        return self._call_llm(messages, stop)
