import streamlit as st
import pandas as pd

st.title("Forecast")

if "clean_df" not in st.session_state:
    st.error(
        "no dataset found. Please upload CSV First"
    )

    st.stop()

df = st.session_state["clean_df"]
st. success("Dataset is uploaded")
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