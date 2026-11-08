"""Persistent control-plane records."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Workload(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True, max_length=200)
    framework: str = Field(default="Custom", max_length=100)
    endpoint_url: str | None = Field(default=None, max_length=2048)
    source_path: str | None = Field(default=None, max_length=2048)
    quality_gate_status: str = Field(default="UNKNOWN", index=True, max_length=16)
    risk_score: int = Field(default=0, ge=0, le=100)
    mcp_count: int = Field(default=0, ge=0)
    findings: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    graph: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    aibom: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    pentest_stats: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Scan(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    workload_id: str = Field(foreign_key="workload.id", index=True)
    findings: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    graph: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    sarif: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    quality_gate_status: str = Field(max_length=16)
    created_at: datetime = Field(default_factory=utcnow)


class PentestRun(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    workload_id: str = Field(foreign_key="workload.id", index=True)
    successful_exploits: int = Field(default=0, ge=0)
    total_episodes: int = Field(default=0, ge=0)
    attack_success_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    logs: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    compromised_node_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=utcnow)


class PentestRequest(SQLModel, table=True):
    """Durable work item leased by a red-team daemon."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    workload_id: str = Field(foreign_key="workload.id", index=True)
    status: str = Field(default="PENDING", index=True, max_length=16)
    worker_id: str | None = Field(default=None, max_length=200)
    error: str | None = Field(default=None, max_length=4000)
    requested_at: datetime = Field(default_factory=utcnow, index=True)
    leased_at: datetime | None = None
    completed_at: datetime | None = None


class Team(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True, max_length=200)
    description: str = Field(default="", max_length=1000)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class TeamMember(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    team_id: str = Field(foreign_key="team.id", index=True)
    name: str = Field(max_length=200)
    email: str = Field(index=True, max_length=320)
    role: str = Field(default="ANALYST", max_length=32)
    status: str = Field(default="INVITED", max_length=16)
    created_at: datetime = Field(default_factory=utcnow)


class Project(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    key: str = Field(index=True, max_length=120)
    name: str = Field(index=True, max_length=200)
    description: str = Field(default="", max_length=2000)
    visibility: str = Field(default="PRIVATE", max_length=16)
    team_id: str | None = Field(default=None, foreign_key="team.id", index=True)
    source_provider: str = Field(default="LOCAL", max_length=32)
    repository_url: str | None = Field(default=None, max_length=2048)
    quality_gate_policy: str = Field(default="VigilAI default", max_length=200)
    workload_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

