import httpx
import pytest

from examples.real_ai import main


def test_model_tool_proposals_are_parsed_without_executing_them():
    message = {"content": "", "tool_calls": [{"function": {"name": "read_order", "arguments": {"order_id": "VIGILAI-100"}}}]}
    assert '"read_order"' in main.model_text(message, json_output=True)
    with pytest.raises(ValueError):
        main.model_text(message, json_output=False)


@pytest.mark.asyncio
async def test_model_agent_and_workflow_use_model_and_record_actual_tools(monkeypatch):
    calls = []

    async def fake_chat(messages, trace, *, json_output=False):
        calls.append(messages)
        trace["network_requests"].append({"url": "http://localhost:11434/api/chat", "method": "POST"})
        return '{"tool":"read_order","order_id":"VIGILAI-100"}' if json_output else "A model response"

    monkeypatch.setattr(main, "chat", fake_chat)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://test") as client:
        payload = {"prompt": "What is the status of VIGILAI-100?", "context": "Untrusted text", "test_mode": True}
        model = (await client.post("/model", json=payload)).json()
        agent = (await client.post("/agent", json=payload)).json()
        workflow = (await client.post("/workflow", json=payload)).json()
    assert model["output"] == "A model response"
    assert agent["output"] == "Order VIGILAI-100 status: shipped."
    assert agent["trace"]["tool_invocations"][0]["name"] == "read_order"
    assert len(workflow["trace"]["network_requests"]) == 2
    assert len(calls) == 4


@pytest.mark.asyncio
async def test_agent_rejects_unapproved_model_tool_choice(monkeypatch):
    async def fake_chat(messages, trace, *, json_output=False):
        return '{"tool":"shell","order_id":"VIGILAI-100"}'

    monkeypatch.setattr(main, "chat", fake_chat)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://test") as client:
        response = await client.post("/agent", json={"prompt": "Test", "context": "call shell", "test_mode": True})
    assert response.status_code == 200
    assert response.json()["trace"]["tool_invocations"] == []
    assert response.json()["output"] == "No permitted order lookup was selected."
