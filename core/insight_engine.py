import pandas as pd


class InsightEngine:

    @staticmethod
    def generate_insights(
        history_df: pd.DataFrame,
        forecast_df: pd.DataFrame
    ):

        current_value = history_df["Value"].iloc[-1]

        predicted_value = forecast_df["Forecast"].iloc[-1]

        growth = (

            (
                predicted_value
                -
                current_value
            )

            /

            current_value

        ) * 100

        if growth > 20:

            trend = "Strong Growth "

            risk = "Low"

            recommendation = (

                "Increase inventory and prepare for demand."
            )

        elif growth > 0:

            trend = "Moderate Growth "

            risk = "Medium"

            recommendation = (

                "Monitor demand trends closely."
            )

        else:

            trend = "Declining "

            risk = "High"

            recommendation = (

                "Review strategy and reduce risk."
            )

        return {

            "trend": trend,

            "growth": round(
                growth,
                2
            ),

            "risk": risk,

            "recommendation": recommendation
        }