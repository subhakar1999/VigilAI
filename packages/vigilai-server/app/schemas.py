"""Validated API transport schemas."""

from __future__ import annotations

import ipaddress
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from urllib.parse import urlparse


class WorkloadInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    framework: str = "Custom"
    endpoint_url: str | None = None
    source_path: str | None = None

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("endpoint_url must be an absolute HTTP(S) URL")
        return value


class FindingInput(BaseModel):
    model_config = ConfigDict(extra="allow")

    rule_id: str = Field(pattern=r"^ASI(?:0[1-9]|10)$")
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    message: str = Field(min_length=1)
    file_path: str = Field(min_length=1)
    line: int | None = Field(default=None, ge=1)
    offset: int | None = Field(default=None, ge=0)
    remediation: str | None = None


class GraphNodeInput(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    category: str = Field(min_length=1)
    file_path: str = Field(min_length=1)
    line: int = Field(ge=1)
    is_vulnerable: bool = False
    is_protected: bool = False
    rule_id: str | None = None
    remediation: str | None = None


class GraphEdgeInput(BaseModel):
    model_config = ConfigDict(extra="allow")

    source: str = Field(min_length=1)
    target: str = Field(min_length=1)
    is_tainted: bool = False


class GraphTopologyInput(BaseModel):
    nodes: list[GraphNodeInput] = Field(default_factory=list)
    edges: list[GraphEdgeInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_references(self) -> "GraphTopologyInput":
        identifiers = [node.id for node in self.nodes]
        if len(identifiers) != len(set(identifiers)):
            raise ValueError("graph node ids must be unique")
        known = set(identifiers)
        if any(edge.source not in known or edge.target not in known for edge in self.edges):
            raise ValueError("graph edges must reference existing nodes")
        return self


class ScanSubmission(BaseModel):
    workload: WorkloadInput
    findings: list[FindingInput] = Field(default_factory=list)
    graph: GraphTopologyInput = Field(default_factory=GraphTopologyInput)
    aibom: dict[str, Any] = Field(default_factory=dict)
    sarif: dict[str, Any] = Field(default_factory=dict)


class PentestCallback(BaseModel):
    workload_id: str
    request_id: str | None = None
    worker_id: str | None = Field(default=None, max_length=200)
    successful_exploits: int = Field(ge=0)
    total_episodes: int = Field(ge=0)
    attack_success_rate: float | None = Field(default=None, ge=0.0, le=1.0)
    logs: list[dict[str, Any]] = Field(default_factory=list)
    compromised_node_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_counts(self) -> "PentestCallback":
        if self.successful_exploits > self.total_episodes:
            raise ValueError("successful_exploits cannot exceed total_episodes")
        computed = self.successful_exploits / self.total_episodes if self.total_episodes else 0.0
        if self.attack_success_rate is None:
            self.attack_success_rate = computed
        elif abs(self.attack_success_rate - computed) > 1e-9:
            raise ValueError("attack_success_rate does not match episode counts")
        if self.request_id and not self.worker_id:
            raise ValueError("worker_id is required when completing a queued request")
        return self


class WorkloadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    framework: str
    quality_gate_status: str
    risk_score: int
    mcp_count: int


class WorkloadDetail(WorkloadSummary):
    endpoint_url: str | None
    source_path: str | None
    findings: list[dict[str, Any]]
    graph: dict[str, Any]
    aibom: dict[str, Any]
    pentest_stats: dict[str, Any]
    quality_gate_reasons: list[str] = Field(default_factory=list)


class ScanResponse(BaseModel):
    workload_id: str
    scan_id: str
    quality_gate_status: str
    risk_score: int


class EndpointOnboardRequest(BaseModel):
    endpoint_url: str
    name: str | None = Field(default=None, min_length=1, max_length=200)

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("endpoint_url must be an absolute HTTP(S) URL")
        if parsed.username or parsed.password:
            raise ValueError("endpoint_url must not contain embedded credentials")
        hostname = parsed.hostname or ""
        if hostname.lower() in {"metadata.google.internal", "metadata.azure.internal"}:
            raise ValueError("cloud metadata endpoints are not allowed")
        try:
            address = ipaddress.ip_address(hostname)
        except ValueError:
            address = None
        if address and (address.is_link_local or address.is_unspecified):
            raise ValueError("link-local and unspecified endpoint addresses are not allowed")
        return value


class EndpointOnboardResponse(ScanResponse):
    endpoint_url: str
    http_status: int
    openapi_detected: bool
    discovered_routes: int


TeamRole = Literal["OWNER", "ADMIN", "MAINTAINER", "ANALYST", "VIEWER"]
MemberStatus = Literal["INVITED", "ACTIVE"]
ProjectVisibility = Literal["PRIVATE", "INTERNAL", "PUBLIC"]
SourceProvider = Literal["LOCAL", "GITHUB", "GITLAB", "AZURE_DEVOPS", "BITBUCKET"]


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=1000)


class TeamMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=320)
    role: TeamRole = "ANALYST"
    status: MemberStatus = "INVITED"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized.count("@") != 1 or "." not in normalized.rsplit("@", 1)[1]:
            raise ValueError("email must be a valid address")
        return normalized


class TeamMemberView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: TeamRole
    status: MemberStatus
    created_at: Any


class TeamSummary(BaseModel):
    id: str
    name: str
    description: str
    member_count: int
    project_count: int


class TeamDetail(TeamSummary):
    members: list[TeamMemberView] = Field(default_factory=list)


class ProjectCreate(BaseModel):
    key: str = Field(min_length=2, max_length=120, pattern=r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    visibility: ProjectVisibility = "PRIVATE"
    team_id: str | None = None
    source_provider: SourceProvider = "LOCAL"
    repository_url: str | None = None
    quality_gate_policy: str = Field(default="VigilAI default", min_length=1, max_length=200)
    workload_ids: list[str] = Field(default_factory=list)

    @field_validator("repository_url")
    @classmethod
    def validate_repository_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("repository_url must be an absolute HTTP(S) URL")
        return value.strip()


class ProjectWorkloadLink(BaseModel):
    workload_id: str


class ProjectSummary(BaseModel):
    id: str
    key: str
    name: str
    description: str
    visibility: ProjectVisibility
    team_id: str | None
    team_name: str | None
    source_provider: SourceProvider
    repository_url: str | None
    quality_gate_policy: str
    workload_ids: list[str]
    workload_count: int
    quality_gate_status: str
    risk_score: int


class ProjectDetail(ProjectSummary):
    workloads: list[WorkloadSummary] = Field(default_factory=list)


class PentestTrigger(BaseModel):
    workload_id: str


class PentestLease(BaseModel):
    request_id: str
    workload_id: str
    workload_name: str
    endpoint_url: str
    tool_schemas: list[dict[str, Any]] = Field(default_factory=list)


class PentestFailure(BaseModel):
    worker_id: str = Field(min_length=1, max_length=200)
    error: str = Field(min_length=1, max_length=4000)

