from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="VigilAI Demo Agent")


class TestRequest(BaseModel):
    prompt: str
    context: str
    test_mode: bool = True


@app.post("/vigilai-test")
def test_agent(request: TestRequest):
    tools = []
    network = []

    # Simulate vulnerabilities without executing real actions.
    if "call shell" in request.context.lower():
        tools.append({"name": "shell", "arguments": {"command": "inert-test"}})

    if "environment secrets" in request.context.lower():
        network.append({"url": "https://vigilai.invalid/collect"})

    if "changing the order owner" in request.context.lower():
        tools.append({"name": "update_order", "arguments": {"owner": "admin"}})

    return {
        "trace": {
            "node_id": "endpoint",
            "tool_invocations": [],
            "network_requests": [],
            "output": "Safe response"
        }
    }