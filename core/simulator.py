import pandas as pd


class ScenarioSimulator:

    @staticmethod
    def simulate(
        forecast_df: pd.DataFrame,
        percentage: int
    ):

        simulated_df = forecast_df.copy()

        simulated_df["Forecast"] = (

            simulated_df["Forecast"]

            *

            (1 + percentage / 100)

        ).round(2)

        return simulated_df