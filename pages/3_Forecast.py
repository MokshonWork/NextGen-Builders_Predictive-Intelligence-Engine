import streamlit as st
import pandas as pd
import plotly.express as px

from visulaization.forecast_chart import ForecastChart
from core.forecast_engine import ForecastEngine
from core.insight_engine import InsightEngine
from core.simulator import ScenarioSimulator

st.title("📈 Forecast")

# -------------------------
# Dataset check
# -------------------------

if "clean_df" not in st.session_state:

    st.error(
        "No dataset found. Please upload a CSV first."
    )

    st.stop()

df = st.session_state["clean_df"]

if len(df) < 20:

    st.error(
        "Dataset must contain at least 20 rows."
    )

    st.stop()

st.success(
    "Dataset uploaded successfully."
)

# -------------------------
# Preview
# -------------------------

st.subheader(
    "📋 Cleaned Dataset"
)

st.dataframe(

    df.tail(10),

    use_container_width=True
)

# -------------------------
# Forecast controls
# -------------------------

forecast_horizon = st.slider(

    "Forecast Horizon (days)",

    min_value=7,

    max_value=365,

    value=30
)

st.write(

    f"You selected {forecast_horizon} days."
)

# -------------------------
# Scenario Simulator
# -------------------------

st.subheader(
    "🧪 Scenario Simulator"
)

scenario_percentage = st.slider(

    "Demand Increase (%)",

    min_value=0,

    max_value=50,

    value=0
)

st.write(

    f"Scenario change: {scenario_percentage}%"
)

# -------------------------
# Generate forecast
# -------------------------

if st.button("🚀 Generate Forecast"):

    with st.spinner(

        "Generating forecast using Google TimesFM..."
    ):

        forecast_df = ForecastEngine.generate_forecast(

            df,

            forecast_horizon
        )

    simulated_df = ScenarioSimulator.simulate(

        forecast_df,

        scenario_percentage
    )

    # -------------------------
    # Table
    # -------------------------

    st.subheader(
        "📊 Forecast Output"
    )

    st.dataframe(

        simulated_df,

        use_container_width=True
    )

    # -------------------------
    # Forecast chart
    # -------------------------

    fig = ForecastChart.create_chart(

        df,

        simulated_df
    )

    st.plotly_chart(

        fig,

        use_container_width=True
    )

    # -------------------------
    # Heatmap
    # -------------------------

    numeric_df = df.select_dtypes(

        include=["number"]
    )

    if len(numeric_df.columns) > 1:

        st.subheader(
            "🔥 Feature Correlation Heatmap"
        )

        corr = numeric_df.corr()

        heatmap = px.imshow(

            corr,

            text_auto=True,

            aspect="auto"
        )

        st.plotly_chart(

            heatmap,

            use_container_width=True
        )

    # -------------------------
    # Histogram
    # -------------------------

    st.subheader(
        "📦 Data Distribution"
    )

    histogram = px.histogram(

        df,

        x="Value",

        nbins=20
    )

    st.plotly_chart(

        histogram,

        use_container_width=True
    )

    # -------------------------
    # Download button
    # -------------------------

    st.download_button(

        label="⬇️ Download Forecast CSV",

        data=simulated_df.to_csv(
            index=False
        ),

        file_name="forecast.csv",

        mime="text/csv"
    )

    # -------------------------
    # Summary metrics
    # -------------------------

    st.subheader(
        "📌 Forecast Summary"
    )

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

    # -------------------------
    # AI insights
    # -------------------------

    insights = InsightEngine.generate_insights(

        df,

        simulated_df
    )

    st.subheader(
        "🤖 AI Insights"
    )

    st.info(

        f"""
        Trend: {insights["trend"]}

        Growth: {insights["growth"]}%

        Risk Level: {insights["risk"]}

        Recommendation:

        {insights["recommendation"]}
        """
    )