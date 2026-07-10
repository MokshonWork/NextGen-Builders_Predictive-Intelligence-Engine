import pandas as pd


class ForecastEngine:

    @staticmethod
    def generate_forecast(
        df: pd.DataFrame,
        horizon: int
    ):

        last_date = df["Date"].max()

        last_value = df["Value"].iloc[-1]

        future_dates = pd.date_range(

            start=last_date + pd.Timedelta(days=1),

            periods=horizon,

            freq="D"
        )

        trend = (

            df["Value"].iloc[-1]

            -

            df["Value"].iloc[0]

        ) / len(df)

        future_values = []

        for i in range(horizon):

            next_value = (

                last_value

                +

                trend * (i + 1)
            )

            future_values.append(

                round(next_value, 2)
            )

        forecast_df = pd.DataFrame({

            "Date": future_dates,

            "Forecast": future_values
        })

        return forecast_df