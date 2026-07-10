import pandas as pd
from core.models import ValidationResult


class CSVValidator:
    REQUIRED_COLUMNS = ["date", "value"]

    @staticmethod
    def detect_frequency(df):
        try:
            dates = pd.to_datetime(df["Date"])
            diff = dates.sort_values().diff().dropna()

            if diff.empty:
                return "Unknown"

            mode = diff.mode()[0].days

            if mode == 1:
                return "Daily"

            elif mode == 7:
                return "Weekly"

            elif 28 <= mode <= 31:
                return "Monthly"

            elif 89 <= mode <= 92:
                return "Quarterly"

            elif 364 <= mode <= 366:
                return "Yearly"

            else:
                return "Irregular"

        except Exception:
            return "Unknown"

    @staticmethod
    def validate(df: pd.DataFrame):

        errors = []
        warnings = []

        # Column Validation
        columns = [c.lower().strip() for c in df.columns]

        for col in CSVValidator.REQUIRED_COLUMNS:
            if col not in columns:
                errors.append(f"Missing required column: {col.title()}")

        if errors:
            return ValidationResult(
                False,
                errors,
                warnings,
                "Unknown",
                len(df)
            )

        # Rename safely
        df.columns = ["Date", "Value"]

        # Minimum amount of Rows

        if len(df) < 12:
            errors.append("Dataset must contain at least 12 rows.")

        # daate validation
        try:
            df["Date"] = pd.to_datetime(df["Date"])

        except Exception:
            errors.append("Invalid Date format.")

        # numeric valida..

        df["Value"] = pd.to_numeric(df["Value"], errors="coerce")
        if df["Value"].isna().any():
            errors.append("Non-numeric values detected.")

        # dd dates

        if df["Date"].duplicated().any():
            errors.append("Duplicate dates found.")

        # missi.values
        if df["Date"].isna().any():
            errors.append("Missing dates detected.")

        if df["Value"].isna().any():
            warnings.append(
                "Missing values found. They will be cleaned automatically."
            )

        if df["Value"].nunique() == 1:
            warnings.append(
                "Constant values detected."#const. value detect.
            )

        # freq.

        frequency = CSVValidator.detect_frequency(df)
        if frequency == "Irregular":
            warnings.append(
                "Irregular frequency detected."
            )

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            detected_frequency=frequency,
            n_rows=len(df)
        )