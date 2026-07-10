import pandas as pd
import numpy as np

from timesfm.timesfm_2p5.timesfm_2p5_torch import (
    TimesFM_2p5_200M_torch
)
from timesfm.configs import ForecastConfig

class ForecastEngine:

    model = TimesFM_2p5_200M_torch.from_pretrained(
        "google/timesfm-2.5-200m-pytorch"
    )
    model.compile(
        ForecastConfig(
            max_context=512,
            max_horizon=365
        )
    )

    @staticmethod
    def generate_forecast(
        df,
        horizon
    ):

        values = df["Value"].values.astype(
            np.float32
        )

        forecast, quantiles = ForecastEngine.model.forecast(
            horizon=horizon,
            inputs=[values]
        )

        print(forecast.shape)
        print(quantiles.shape)

        future_dates = pd.date_range(

            start=df["Date"].iloc[-1],

            periods=horizon + 1,

            freq="D"

        )[1:]

        forecast_df = pd.DataFrame(

            {
                "Date": future_dates,
                "Forecast": forecast[0]
            }

        )

        return forecast_df