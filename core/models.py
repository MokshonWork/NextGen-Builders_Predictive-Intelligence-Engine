from dataclasses import dataclass, field
from typing import List


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    detected_frequency: str = "Unknown"
    n_rows: int = 0


@dataclass
class CleanLog:
    duplicates_removed: int = 0
    nulls_filled: int = 0
    outliers_capped: int = 0
    final_row_count: int = 0