import streamlit as st
import pandas as pd
from visulaization.forecast_chart import ForecastChart
from core.forecast_engine import ForecastEngine

st.title(" Forecast")

if "clean_df" not in st.session_state:
    st.error(
        "No dataset found. Please upload a CSV first."
    )
    st.stop()

df = st.session_state["clean_df"]
st.success("Dataset is uploaded ")

st.subheader("Cleaned Dataset")

st.dataframe(
    df.tail(10),
    use_container_width=True
)

forecast_horizon = st.slider(
    "Forecast Horizon (days)",
    min_value=7,
    max_value=365,
    value=30
)

st.write(
    f"You selected {forecast_horizon} days."
)

if st.button(" Generate Forecast"):
    forecast_df = ForecastEngine.generate_forecast(
        df,
        forecast_horizon
    )

    st.subheader(" Forecast Output")
    st.dataframe(

        forecast_df,
        use_container_width=True
    )

    fig = ForecastChart.create_chart(
        df,
        forecast_df
    )

    st.plotly_chart(
        fig,
        use_container_width=True
    )

    st.subheader(" Forecast Summary")
    col1, col2, col3 = st.columns(3)
    col1.metric(
        "Current Value",
        round(
            df["Value"].iloc[-1],
            2
        )
    )

    col2.metric(
        "Predicted Value",

        round(
            forecast_df["Forecast"].iloc[-1],
            2
        )
    )

    growth = (

        (
            forecast_df["Forecast"].iloc[-1]

            -

            df["Value"].iloc[-1]
        )

        /

        df["Value"].iloc[-1]

    ) * 100

    col3.metric(
        "Growth",
        f"{growth:.2f}%"
    )