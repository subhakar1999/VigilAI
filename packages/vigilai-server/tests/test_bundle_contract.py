from pathlib import Path

from app.schemas import ScanSubmission
from vigilai.cli import build_scan_bundle


def test_scanner_bundle_matches_server_contract() -> None:
    repository = Path(__file__).resolve().parents[3]
    bundle = build_scan_bundle(repository / "packages" / "vigilai-scanner" / "tests", "contract-test")
    validated = ScanSubmission.model_validate(bundle)
    assert validated.workload.name == "contract-test"
    assert validated.graph.nodes
    assert validated.sarif["version"] == "2.1.0"
