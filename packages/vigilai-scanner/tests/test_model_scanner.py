import os
import pickle

from vigilai.model_scanner import SymbolicPVMScanner


class Exploit:
    def __reduce__(self):
        return os.system, ("echo never-executed",)


def test_detects_unsafe_reduce_exploit() -> None:
    findings = SymbolicPVMScanner().scan_bytes(pickle.dumps(Exploit()))
    assert any(finding.severity == "CRITICAL" and "system" in finding.message for finding in findings)

