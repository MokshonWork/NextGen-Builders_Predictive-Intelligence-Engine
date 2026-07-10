import pandas as pd
from core.models import CleanLog

class DataCleaner:

    @staticmethod
    def clean(df: pd.DataFrame):

        df = df.copy()

        duplicates_removed = 0
        nulls_filled = 0
        outliers_capped = 0

        # Removing duplicate dates --> wrna forecasting ka fayda hi kya hua.
        before = len(df)

        df = df.drop_duplicates(
            subset=["Date"],
            keep="first"
        )
        duplicates_removed = before - len(df) # checking how much dublicate values are removed

        # Converting types
        df["Date"] = pd.to_datetime(df["Date"])

        df["Value"] = pd.to_numeric(
            df["Value"],
            errors="coerce"
        )

        # date sorting (low->high)

        df = df.sort_values(
            by="Date"
        )

        before_nulls = df["Value"].isna().sum()
      # filling missing values
        df["Value"] = (
            df["Value"]
            .interpolate()
            .ffill()
            .bfill()
        )

        after_nulls = df["Value"].isna().sum()
        nulls_filled = before_nulls - after_nulls

        # handling with outliers
        # 5 number summary
        mean = df["Value"].mean()
        std = df["Value"].std()
        upper_limit = mean + 3 * std
        lower_limit = mean - 3 * std

        outlier_mask = (
            (df["Value"] > upper_limit)
            |
            (df["Value"] < lower_limit)
        )

        outliers_capped = outlier_mask.sum()

        df.loc[
            df["Value"] > upper_limit,
            "Value"
        ] = upper_limit

        df.loc[
            df["Value"] < lower_limit,
            "Value"
        ] = lower_limit

      #logs
        log = CleanLog(
            duplicates_removed=duplicates_removed,
            nulls_filled=nulls_filled,
            outliers_capped=outliers_capped,
            final_row_count=len(df)
        )

        return df, log