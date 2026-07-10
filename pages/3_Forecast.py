import streamlit as st
import pandas as pd
from visulaization.forecast_chart import ForecastChart
from core.forecast_engine import ForecastEngine
from core.insight_engine import InsightEngine
from core.simulator import ScenarioSimulator

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

st.subheader("Scenario Simulator")

scenario_percentage = st.slider(

    "Demand Increase (%)",

    min_value=0,

    max_value=50,

    value=0
)

st.write(

    f"Scenario change: {scenario_percentage}%"
)

if st.button(" Generate Forecast"):

    forecast_df = ForecastEngine.generate_forecast(
        df,
        forecast_horizon
    )

    simulated_df = ScenarioSimulator.simulate(

        forecast_df,

        scenario_percentage
    )

    st.subheader(" Forecast Output")

    st.dataframe(

        simulated_df,

        use_container_width=True
    )

    fig = ForecastChart.create_chart(

        df,

        simulated_df
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
            simulated_df["Forecast"].iloc[-1],
            2
        )
    )

    growth = (

        (
            simulated_df["Forecast"].iloc[-1]

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

    insights = InsightEngine.generate_insights(

        df,

        simulated_df
    )

    st.subheader("AI Insights")

    st.info(

        f"""
        Trend: {insights["trend"]}

        Growth: {insights["growth"]}%

        Risk Level: {insights["risk"]}

        Recommendation:
        {insights["recommendation"]}
        """
    )